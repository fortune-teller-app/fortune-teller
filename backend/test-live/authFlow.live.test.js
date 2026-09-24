const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('../src/app');
const supabase = require('../src/config/supabase');
const { comparePassword } = require('../src/utils/password');

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

function assertEnvironment() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  assert.deepEqual(missing, [], `Missing live-test environment variables: ${missing.join(', ')}`);
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
    server.once('error', reject);
  });
}

async function stopServer(server) {
  if (!server) return;
  if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

function createApi(baseUrl) {
  return async function request(route, { method = 'GET', body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}${route}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { status: response.status, data };
  };
}

async function assertNoDatabaseError(result, operation) {
  assert.equal(result.error, null, `${operation}: ${result.error?.message || 'unknown database error'}`);
  return result.data;
}

test('live Supabase authentication and authorization workflow', { timeout: 60_000 }, async (t) => {
  assertEnvironment();

  const suffix = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  const users = {
    a: {
      name: `QA Aurora ${suffix}`,
      email: `qa-${suffix}-a@example.com`,
      password: `QA-A-${suffix}!`,
      birthDate: '1990-01-15',
      birthTime: '06:30',
      birthPlace: 'Toronto',
    },
    b: {
      name: `QA Borealis ${suffix}`,
      email: `qa-${suffix}-b@example.com`,
      password: `QA-B-${suffix}!`,
      birthDate: '1992-02-20',
      birthTime: '19:45',
      birthPlace: 'Vancouver',
    },
  };
  const rollbackEmail = `qa-${suffix}-rollback@example.com`;
  const cleanupEmails = [users.a.email, users.b.email, rollbackEmail];
  const created = {};
  let server;

  try {
    server = await startServer();
    const address = server.address();
    const api = createApi(`http://127.0.0.1:${address.port}`);

    await t.test('health endpoint reaches the live Supabase project', async () => {
      const response = await api('/health');
      assert.equal(response.status, 200);
      assert.equal(response.data.status, 'Connected to Supabase');
    });

    await t.test('invalid registration and login payloads are rejected before database access', async () => {
      const invalidEmail = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'not-an-email', password: 'password123' },
      });
      assert.equal(invalidEmail.status, 400);
      assert.equal(invalidEmail.data.error.code, 'INVALID_EMAIL');

      const weakPassword = await api('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'QA Weak Password',
          birthDate: '1990-01-01',
          email: `qa-${suffix}-weak@example.com`,
          password: 'short',
        },
      });
      assert.equal(weakPassword.status, 400);
      assert.equal(weakPassword.data.error.code, 'WEAK_PASSWORD');
    });

    await t.test('two users register and persist with hashed passwords and birth profiles', async () => {
      for (const key of ['a', 'b']) {
        const response = await api('/api/auth/register', {
          method: 'POST',
          body: users[key],
        });
        assert.equal(response.status, 201, JSON.stringify(response.data));
        assert.equal(response.data.user.email, users[key].email);
        assert.equal(response.data.user.password_hash, undefined);
        assert.equal(typeof response.data.token, 'string');
        created[key] = { ...response.data.user, token: response.data.token };
      }

      const storedUsers = await assertNoDatabaseError(
        await supabase
          .from('users')
          .select('id, name, email, password_hash')
          .in('email', [users.a.email, users.b.email]),
        'load registered users'
      );
      assert.equal(storedUsers.length, 2);

      for (const key of ['a', 'b']) {
        const stored = storedUsers.find((row) => row.email === users[key].email);
        assert.ok(stored);
        assert.notEqual(stored.password_hash, users[key].password);
        assert.match(stored.password_hash, /^\$2[aby]\$/);
        assert.equal(await comparePassword(users[key].password, stored.password_hash), true);
      }

      const profiles = await assertNoDatabaseError(
        await supabase
          .from('astrology_profile')
          .select('user_id, birth_date, birth_time, birth_city')
          .in('user_id', [created.a.id, created.b.id]),
        'load birth profiles'
      );
      assert.equal(profiles.length, 2);
      assert.equal(profiles.find((row) => row.user_id === created.a.id).birth_city, 'Toronto');
      assert.equal(profiles.find((row) => row.user_id === created.b.id).birth_city, 'Vancouver');
    });

    await t.test('duplicate accounts and bad credentials return safe errors', async () => {
      const duplicate = await api('/api/auth/register', {
        method: 'POST',
        body: { ...users.a, email: users.a.email.toUpperCase() },
      });
      assert.equal(duplicate.status, 409);
      assert.equal(duplicate.data.error.code, 'EMAIL_TAKEN');

      const wrongPassword = await api('/api/auth/login', {
        method: 'POST',
        body: { email: users.a.email, password: 'definitely-wrong' },
      });
      const unknownAccount = await api('/api/auth/login', {
        method: 'POST',
        body: { email: `qa-${suffix}-missing@example.com`, password: 'definitely-wrong' },
      });
      assert.equal(wrongPassword.status, 401);
      assert.equal(unknownAccount.status, 401);
      assert.deepEqual(wrongPassword.data.error, unknownAccount.data.error);
      assert.equal(wrongPassword.data.error.code, 'INVALID_CREDENTIALS');
    });

    await t.test('a failed birth-profile insert rolls back its user row', async () => {
      const response = await api('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'QA Rollback',
          birthDate: 'not-a-database-date',
          email: rollbackEmail,
          password: `QA-Rollback-${suffix}!`,
        },
      });
      assert.equal(response.status, 500);
      assert.equal(response.data.error.code, 'DB_ERROR');

      const result = await supabase
        .from('users')
        .select('id')
        .eq('email', rollbackEmail)
        .maybeSingle();
      await assertNoDatabaseError(result, 'verify registration rollback');
      assert.equal(result.data, null);
    });

    await t.test('login normalizes email and issued tokens access only their own account', async () => {
      const loginA = await api('/api/auth/login', {
        method: 'POST',
        body: { email: `  ${users.a.email.toUpperCase()}  `, password: users.a.password },
      });
      assert.equal(loginA.status, 200);
      assert.equal(loginA.data.user.id, created.a.id);
      created.a.token = loginA.data.token;

      const accountA = await api(`/api/auth/me?userId=${created.b.id}`, { token: created.a.token });
      const accountB = await api(`/api/auth/me?userId=${created.a.id}`, { token: created.b.token });
      assert.equal(accountA.status, 200);
      assert.equal(accountB.status, 200);
      assert.equal(accountA.data.user.id, created.a.id);
      assert.equal(accountB.data.user.id, created.b.id);
      assert.equal(accountA.data.user.password_hash, undefined);
      assert.equal(accountB.data.user.password_hash, undefined);
    });

    await t.test('missing, invalid, tampered, and expired tokens are rejected', async () => {
      const missing = await api('/api/profile/me');
      const invalid = await api('/api/profile/me', { token: 'not-a-jwt' });
      const tampered = await api('/api/profile/me', {
        token: jwt.sign({ sub: created.a.id }, 'wrong-signing-secret', { expiresIn: '5m' }),
      });
      const expired = await api('/api/profile/me', {
        token: jwt.sign(
          { sub: created.a.id, email: users.a.email },
          process.env.JWT_SECRET,
          { expiresIn: -1 }
        ),
      });

      assert.equal(missing.status, 401);
      assert.equal(missing.data.error.code, 'UNAUTHORIZED');
      for (const response of [invalid, tampered, expired]) {
        assert.equal(response.status, 401);
        assert.equal(response.data.error.code, 'INVALID_TOKEN');
      }
    });

    await t.test('profile reads and updates remain scoped to the token owner', async () => {
      const profileA = await api(`/api/profile/me?userId=${created.b.id}`, { token: created.a.token });
      assert.equal(profileA.status, 200);
      assert.equal(profileA.data.profile.id, created.a.id);
      assert.equal(profileA.data.profile.birthCity, 'Toronto');

      const updateA = await api('/api/profile', {
        method: 'PATCH',
        token: created.a.token,
        body: {
          userId: created.b.id,
          name: `QA Aurora Updated ${suffix}`,
          birthPlace: 'Ottawa',
        },
      });
      assert.equal(updateA.status, 200, JSON.stringify(updateA.data));
      assert.equal(updateA.data.profile.id, created.a.id);
      assert.equal(updateA.data.profile.birthCity, 'Ottawa');

      const profileB = await api('/api/profile/me', { token: created.b.token });
      assert.equal(profileB.status, 200);
      assert.equal(profileB.data.profile.id, created.b.id);
      assert.equal(profileB.data.profile.name, users.b.name);
      assert.equal(profileB.data.profile.birthCity, 'Vancouver');

      const duplicateEmail = await api('/api/profile', {
        method: 'PATCH',
        token: created.a.token,
        body: { email: users.b.email },
      });
      assert.equal(duplicateEmail.status, 409);
      assert.equal(duplicateEmail.data.error.code, 'EMAIL_TAKEN');
    });

    await t.test('reading and dream statistics cannot include another user data', async () => {
      await assertNoDatabaseError(
        await supabase.from('reading_session').insert([
          { user_id: created.a.id, session_type: 'tarot' },
          { user_id: created.a.id, session_type: 'tarot' },
          { user_id: created.b.id, session_type: 'astrology' },
        ]),
        'insert QA reading sessions'
      );
      await assertNoDatabaseError(
        await supabase.from('dream_entry').insert([
          { user_id: created.a.id, title: 'QA A', dream_text: 'QA dream A' },
          { user_id: created.b.id, title: 'QA B1', dream_text: 'QA dream B1' },
          { user_id: created.b.id, title: 'QA B2', dream_text: 'QA dream B2' },
        ]),
        'insert QA dream entries'
      );

      const statsA = await api(`/api/profile/stats?userId=${created.b.id}`, { token: created.a.token });
      const statsB = await api(`/api/profile/stats?userId=${created.a.id}`, { token: created.b.token });
      assert.equal(statsA.status, 200);
      assert.equal(statsB.status, 200);
      assert.equal(statsA.data.stats.totalReadings, 2);
      assert.equal(statsA.data.stats.dreamCount, 1);
      assert.deepEqual(statsA.data.stats.mostRead, { tarot: 2 });
      assert.equal(statsB.data.stats.totalReadings, 1);
      assert.equal(statsB.data.stats.dreamCount, 2);
      assert.deepEqual(statsB.data.stats.mostRead, { astrology: 1 });
    });

    await t.test('the anonymous Supabase key cannot read private user rows directly', async () => {
      const anonymousClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );
      const result = await anonymousClient
        .from('users')
        .select('id')
        .in('id', [created.a.id, created.b.id]);

      if (result.error) {
        assert.match(result.error.message, /permission|policy|denied|row-level security/i);
      } else {
        assert.deepEqual(result.data, []);
      }
    });
  } finally {
    const cleanup = await supabase
      .from('users')
      .delete()
      .in('email', cleanupEmails);
    assert.equal(cleanup.error, null, `QA cleanup failed: ${cleanup.error?.message || 'unknown error'}`);

    const remaining = await supabase
      .from('users')
      .select('id')
      .in('email', cleanupEmails);
    assert.equal(remaining.error, null, `QA cleanup verification failed: ${remaining.error?.message || 'unknown error'}`);
    assert.deepEqual(remaining.data, []);
    await stopServer(server);
  }
});
