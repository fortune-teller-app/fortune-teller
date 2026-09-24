const test = require('node:test');
const assert = require('node:assert/strict');
const { afterEach } = require('node:test');
const { createSupabaseMock, actionArgs } = require('./helpers/supabaseMock');

const modulePaths = {
  service: require.resolve('../src/services/authService'),
  supabase: require.resolve('../src/config/supabase'),
  password: require.resolve('../src/utils/password'),
  jwt: require.resolve('../src/utils/jwt'),
};

function putInRequireCache(path, exports) {
  require.cache[path] = { id: path, filename: path, loaded: true, exports };
}

function loadAuthService({ supabase, password = {}, jwt = {} }) {
  delete require.cache[modulePaths.service];
  putInRequireCache(modulePaths.supabase, supabase);
  putInRequireCache(modulePaths.password, {
    hashPassword: async () => 'hashed-password',
    comparePassword: async () => true,
    ...password,
  });
  putInRequireCache(modulePaths.jwt, {
    signToken: () => 'signed-token',
    ...jwt,
  });
  return require(modulePaths.service);
}

afterEach(() => {
  Object.values(modulePaths).forEach((path) => delete require.cache[path]);
  delete process.env.JWT_SECRET;
});

test('login normalizes the email, verifies the hash, and returns no password data', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const storedUser = {
    id: 'user-a',
    name: 'Aurora',
    email: 'aurora@example.com',
    password_hash: 'stored-hash',
  };
  const supabase = createSupabaseMock([{ data: storedUser, error: null }]);
  const compared = [];
  const signed = [];
  const authService = loadAuthService({
    supabase,
    password: {
      comparePassword: async (...args) => {
        compared.push(args);
        return true;
      },
    },
    jwt: {
      signToken: (payload) => {
        signed.push(payload);
        return 'jwt-for-user-a';
      },
    },
  });

  const result = await authService.login({
    email: '  AURORA@EXAMPLE.COM ',
    password: 'correct horse battery staple',
  });

  assert.deepEqual(actionArgs(supabase.calls[0], 'eq'), ['email', 'aurora@example.com']);
  assert.deepEqual(compared, [['correct horse battery staple', 'stored-hash']]);
  assert.deepEqual(signed, [{ sub: 'user-a', email: 'aurora@example.com' }]);
  assert.deepEqual(result, {
    token: 'jwt-for-user-a',
    user: { id: 'user-a', name: 'Aurora', email: 'aurora@example.com' },
  });
  assert.equal('password_hash' in result.user, false);
});

test('login uses the same safe error for an unknown email and a wrong password', async (t) => {
  process.env.JWT_SECRET = 'test-secret';

  await t.test('unknown email', async () => {
    const authService = loadAuthService({
      supabase: createSupabaseMock([{ data: null, error: null }]),
    });

    await assert.rejects(
      () => authService.login({ email: 'missing@example.com', password: 'anything' }),
      (error) => error.status === 401
        && error.code === 'INVALID_CREDENTIALS'
        && error.message === 'Email or password is incorrect.'
    );
  });

  await t.test('wrong password', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const authService = loadAuthService({
      supabase: createSupabaseMock([{
        data: { id: 'user-a', email: 'aurora@example.com', password_hash: 'stored-hash' },
        error: null,
      }]),
      password: { comparePassword: async () => false },
    });

    await assert.rejects(
      () => authService.login({ email: 'aurora@example.com', password: 'wrong' }),
      (error) => error.status === 401
        && error.code === 'INVALID_CREDENTIALS'
        && error.message === 'Email or password is incorrect.'
    );
  });
});

test('login reports database failures without attempting password verification', async () => {
  process.env.JWT_SECRET = 'test-secret';
  let compared = false;
  const authService = loadAuthService({
    supabase: createSupabaseMock([{ data: null, error: { message: 'offline' } }]),
    password: {
      comparePassword: async () => {
        compared = true;
        return true;
      },
    },
  });

  await assert.rejects(
    () => authService.login({ email: 'aurora@example.com', password: 'password123' }),
    (error) => error.status === 500 && error.code === 'DB_ERROR'
  );
  assert.equal(compared, false);
});

test('registration stores normalized account data, a password hash, and the matching birth profile', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const createdUser = { id: 'user-new', name: 'Nova', email: 'nova@example.com' };
  const supabase = createSupabaseMock([
    { data: null, error: null },
    { data: createdUser, error: null },
    { data: null, error: null },
  ]);
  const hashed = [];
  const authService = loadAuthService({
    supabase,
    password: {
      hashPassword: async (password) => {
        hashed.push(password);
        return 'bcrypt-hash';
      },
    },
  });

  const result = await authService.register({
    name: '  Nova  ',
    birthDate: '1998-07-14',
    birthTime: '06:30',
    birthPlace: 'Toronto',
    email: ' NOVA@EXAMPLE.COM ',
    password: 'super-secret',
  });

  assert.deepEqual(hashed, ['super-secret']);
  assert.deepEqual(actionArgs(supabase.calls[1], 'insert'), [{
    name: 'Nova',
    email: 'nova@example.com',
    password_hash: 'bcrypt-hash',
  }]);
  assert.deepEqual(actionArgs(supabase.calls[2], 'insert'), [{
    user_id: 'user-new',
    birth_date: '1998-07-14',
    birth_time: '06:30',
    birth_city: 'Toronto',
  }]);
  assert.deepEqual(result.user, createdUser);
});

test('registration rejects duplicate emails before hashing or inserting', async () => {
  process.env.JWT_SECRET = 'test-secret';
  let hashed = false;
  const supabase = createSupabaseMock([{ data: { id: 'existing' }, error: null }]);
  const authService = loadAuthService({
    supabase,
    password: {
      hashPassword: async () => {
        hashed = true;
        return 'unused';
      },
    },
  });

  await assert.rejects(
    () => authService.register({
      name: 'Nova',
      birthDate: '1998-07-14',
      email: 'nova@example.com',
      password: 'super-secret',
    }),
    (error) => error.status === 409 && error.code === 'EMAIL_TAKEN'
  );
  assert.equal(hashed, false);
  assert.equal(supabase.calls.length, 1);
});

test('registration removes the user row when birth-profile storage fails', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const supabase = createSupabaseMock([
    { data: null, error: null },
    { data: { id: 'orphan-risk', name: 'Nova', email: 'nova@example.com' }, error: null },
    { data: null, error: { message: 'insert failed' } },
    { data: null, error: null },
  ]);
  const authService = loadAuthService({ supabase });

  await assert.rejects(
    () => authService.register({
      name: 'Nova',
      birthDate: '1998-07-14',
      email: 'nova@example.com',
      password: 'super-secret',
    }),
    (error) => error.status === 500 && error.code === 'DB_ERROR'
  );

  assert.equal(supabase.calls[3].table, 'users');
  assert.ok(actionArgs(supabase.calls[3], 'delete'));
  assert.deepEqual(actionArgs(supabase.calls[3], 'eq'), ['id', 'orphan-risk']);
});

test('authentication operations fail closed when JWT signing is not configured', async () => {
  const supabase = createSupabaseMock([]);
  const authService = loadAuthService({ supabase });

  await assert.rejects(
    () => authService.login({ email: 'aurora@example.com', password: 'password123' }),
    (error) => error.status === 500 && error.code === 'SERVER_MISCONFIGURED'
  );
  assert.equal(supabase.calls.length, 0);
});
