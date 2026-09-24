const test = require('node:test');
const assert = require('node:assert/strict');
const { validateLogin, validateRegister } = require('../src/middleware/validateAuth');

function runValidation(validation, body) {
  const req = { body };
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(responseBody) {
      this.body = responseBody;
      return this;
    },
  };
  let nextCalled = false;
  validation(req, res, () => { nextCalled = true; });
  return { res, nextCalled };
}

test('login validation rejects malformed emails', () => {
  const { res, nextCalled } = runValidation(validateLogin, {
    email: 'not-an-email',
    password: 'password123',
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, 'INVALID_EMAIL');
  assert.equal(nextCalled, false);
});

test('login validation rejects a missing password', () => {
  const { res, nextCalled } = runValidation(validateLogin, {
    email: 'aurora@example.com',
    password: '',
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, 'MISSING_PASSWORD');
  assert.equal(nextCalled, false);
});

test('login validation passes a complete credential payload', () => {
  const { res, nextCalled } = runValidation(validateLogin, {
    email: 'aurora@example.com',
    password: 'password123',
  });

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});

test('registration validation enforces the minimum password length', () => {
  const { res, nextCalled } = runValidation(validateRegister, {
    name: 'Aurora',
    birthDate: '1990-01-01',
    email: 'aurora@example.com',
    password: 'short',
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, 'WEAK_PASSWORD');
  assert.equal(nextCalled, false);
});
