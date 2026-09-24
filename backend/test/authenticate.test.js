const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
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

test('accepts a valid token and derives the authenticated identity from its subject', () => {
  process.env.JWT_SECRET = 'middleware-test-secret';
  const token = jwt.sign(
    { sub: 'user-a', email: 'aurora@example.com' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: 'user-a', email: 'aurora@example.com' });
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
