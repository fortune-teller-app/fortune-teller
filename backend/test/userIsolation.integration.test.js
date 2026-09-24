const test = require('node:test');
const assert = require('node:assert/strict');

const TEST_SECRET = 'integration-test-secret-with-sufficient-length';

function createReadOnlySupabase(dataByTable) {
  const calls = [];

  function from(table) {
    const call = { table, filters: [] };
    calls.push(call);
    let limit = null;

    function filteredRows() {
      let rows = [...(dataByTable[table] || [])];
      for (const [column, value] of call.filters) {
        rows = rows.filter((row) => row[column] === value);
      }
      if (limit != null) rows = rows.slice(0, limit);
      return rows;
    }

    const builder = {
      select(...args) {
        call.selectArgs = args;
        return builder;
      },
      eq(column, value) {
        call.filters.push([column, value]);
        return builder;
      },
      order() {
        return builder;
      },
      limit(value) {
        limit = value;
        return builder;
      },
      maybeSingle() {
        const rows = filteredRows();
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      then(resolve, reject) {
        const rows = filteredRows();
        const options = call.selectArgs?.[1];
        const result = options?.count === 'exact' && options?.head
          ? { count: rows.length, error: null }
          : { data: rows, error: null };
        return Promise.resolve(result).then(resolve, reject);
      },
    };

    return builder;
  }

  return { from, calls };
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const users = [
  {
    id: 'user-a',
    name: 'Aurora',
    email: 'aurora@example.com',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-b',
    name: 'Borealis',
    email: 'borealis@example.com',
    created_at: '2026-02-01T00:00:00.000Z',
  },
];

const profiles = [
  {
    id: 'profile-a',
    user_id: 'user-a',
    birth_date: '1990-01-01',
    birth_time: null,
    birth_city: 'Toronto',
    birth_country: 'Canada',
    zodiac_sign: 'Capricorn',
    moon_sign: null,
    rising_sign: null,
  },
  {
    id: 'profile-b',
    user_id: 'user-b',
    birth_date: '1991-02-02',
    birth_time: null,
    birth_city: 'Vancouver',
    birth_country: 'Canada',
    zodiac_sign: 'Aquarius',
    moon_sign: null,
    rising_sign: null,
  },
];

let authenticate;
let authController;
let profileController;
let signToken;
let supabase;
let originalSecret;
const configPath = require.resolve('../src/config/supabase');

test.before(() => {
  originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;
  supabase = createReadOnlySupabase({
    users,
    astrology_profile: profiles,
    user_subscription: [],
    reading_session: [
      { id: 'reading-a-1', user_id: 'user-a', session_type: 'tarot' },
      { id: 'reading-a-2', user_id: 'user-a', session_type: 'tarot' },
      { id: 'reading-b-1', user_id: 'user-b', session_type: 'dream' },
    ],
    dream_entry: [
      { id: 'dream-a-1', user_id: 'user-a' },
      { id: 'dream-b-1', user_id: 'user-b' },
      { id: 'dream-b-2', user_id: 'user-b' },
    ],
  });
  require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: supabase,
  };

  ({ signToken } = require('../src/utils/jwt'));
  authenticate = require('../src/middleware/authenticate');
  authController = require('../src/controllers/authController');
  profileController = require('../src/controllers/profileController');
});

test.after(() => {
  delete require.cache[configPath];
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

async function runProtectedController(controller, user, overrides = {}) {
  const token = signToken({ sub: user.id, email: user.email });
  const req = {
    headers: { authorization: `Bearer ${token}` },
    query: {},
    body: {},
    ...overrides,
  };
  const res = createResponse();

  await new Promise((resolve, reject) => {
    authenticate(req, res, () => {
      Promise.resolve(controller(req, res)).then(resolve, reject);
    });
  });

  return { req, res };
}

test('protected profile data cannot be selected by a caller-supplied user ID', async () => {
  const { res } = await runProtectedController(profileController.me, users[0], {
    query: { userId: 'user-b' },
    body: { userId: 'user-b' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.profile.id, 'user-a');
  assert.equal(res.body.profile.email, 'aurora@example.com');
  assert.equal(res.body.profile.birthCity, 'Toronto');
  assert.notEqual(res.body.profile.email, 'borealis@example.com');

  const profileCalls = supabase.calls.filter((call) =>
    call.table === 'users' || call.table === 'astrology_profile' || call.table === 'user_subscription'
  );
  assert.ok(profileCalls.length >= 3);
  for (const call of profileCalls.slice(-3)) {
    const expectedColumn = call.table === 'users' ? 'id' : 'user_id';
    assert.ok(call.filters.some(([column, value]) =>
      column === expectedColumn && value === 'user-a'
    ));
  }
});

test('each valid token returns only its own account from the auth controller', async () => {
  const [{ res: responseA }, { res: responseB }] = await Promise.all([
    runProtectedController(authController.me, users[0], { query: { userId: 'user-b' } }),
    runProtectedController(authController.me, users[1], { query: { userId: 'user-a' } }),
  ]);

  assert.equal(responseA.body.user.id, 'user-a');
  assert.equal(responseB.body.user.id, 'user-b');
  assert.equal(responseA.body.user.password_hash, undefined);
  assert.equal(responseB.body.user.password_hash, undefined);
});

test('reading statistics are scoped to the authenticated user', async () => {
  const callsBefore = supabase.calls.length;
  const { res } = await runProtectedController(profileController.stats, users[0], {
    query: { userId: 'user-b' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.stats.totalReadings, 2);
  assert.equal(res.body.stats.dreamCount, 1);
  assert.deepEqual(res.body.stats.mostRead, { tarot: 2 });

  // authenticate's revocation lookup is keyed by jti, not user data.
  const statsCalls = supabase.calls.slice(callsBefore)
    .filter((call) => call.table !== 'revoked_tokens');
  assert.deepEqual(statsCalls.map((call) => call.table), [
    'users',
    'reading_session',
    'dream_entry',
  ]);
  for (const call of statsCalls) {
    const expectedColumn = call.table === 'users' ? 'id' : 'user_id';
    assert.ok(call.filters.some(([column, value]) =>
      column === expectedColumn && value === 'user-a'
    ));
  }
});

test('protected data access rejects missing and invalid tokens before querying storage', () => {
  const callsBefore = supabase.calls.length;
  const missingRes = createResponse();
  const invalidRes = createResponse();

  authenticate({ headers: {} }, missingRes, () => assert.fail('next must not be called'));
  authenticate(
    { headers: { authorization: 'Bearer not-a-valid-token' } },
    invalidRes,
    () => assert.fail('next must not be called')
  );

  assert.equal(missingRes.statusCode, 401);
  assert.equal(missingRes.body.error.code, 'UNAUTHORIZED');
  assert.equal(invalidRes.statusCode, 401);
  assert.equal(invalidRes.body.error.code, 'INVALID_TOKEN');
  assert.equal(supabase.calls.length, callsBefore);
});
