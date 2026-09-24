const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createSupabaseMock } = require('./helpers/supabaseMock');

// authenticate checks the revocation list through authService, so stub the
// Supabase client before the middleware (and its dependencies) load.
const supabasePath = require.resolve('../src/config/supabase');
let supabase = createSupabaseMock();
require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { from: (table) => supabase.from(table) },
};
const authenticate = require('../src/middleware/authenticate');

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

test('rejects requests without a Bearer token', () => {
  const req = { headers: {} };
  const res = createResponse();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
  assert.equal(nextCalled, false);
});

test('accepts a valid token and derives the authenticated identity from its subject', async () => {
  process.env.JWT_SECRET = 'middleware-test-secret';
  supabase = createSupabaseMock([{ data: null, error: null }]);
  const token = jwt.sign(
    { sub: 'user-a', email: 'aurora@example.com', jti: 'jti-a' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  let nextCalled = false;

  await authenticate(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: 'user-a', email: 'aurora@example.com' });
  assert.equal(req.auth.payload.jti, 'jti-a');
  assert.equal(supabase.calls[0].table, 'revoked_tokens');
});

test('rejects revoked tokens and tokens without a jti', async (t) => {
  process.env.JWT_SECRET = 'middleware-test-secret';

  await t.test('revoked token', async () => {
    supabase = createSupabaseMock([{ data: { id: 'revocation-1' }, error: null }]);
    const token = jwt.sign({ sub: 'user-a', jti: 'jti-a' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();

    await authenticate(req, res, () => assert.fail('next must not be called'));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'TOKEN_REVOKED');
  });

  await t.test('token without a jti', async () => {
    supabase = createSupabaseMock();
    const token = jwt.sign({ sub: 'user-a' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();

    await authenticate(req, res, () => assert.fail('next must not be called'));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'TOKEN_REVOKED');
  });
});

test('fails closed when the revocation list cannot be checked', async () => {
  process.env.JWT_SECRET = 'middleware-test-secret';
  supabase = createSupabaseMock([{ data: null, error: { code: 'PGRST205', message: 'missing' } }]);
  const token = jwt.sign({ sub: 'user-a', jti: 'jti-a' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  const originalError = console.error;
  console.error = () => {};

  try {
    await authenticate(req, res, () => assert.fail('next must not be called'));
  } finally {
    console.error = originalError;
  }

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error.code, 'SESSION_CHECK_FAILED');
});

test('rejects tampered and expired tokens', async (t) => {
  process.env.JWT_SECRET = 'middleware-test-secret';

  await t.test('tampered token', () => {
    const token = jwt.sign({ sub: 'user-a' }, 'different-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();

    authenticate(req, res, () => assert.fail('next must not be called'));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  await t.test('expired token', () => {
    const token = jwt.sign({ sub: 'user-a' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();

    authenticate(req, res, () => assert.fail('next must not be called'));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });
});
