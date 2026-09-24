const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, comparePassword } = require('../src/utils/password');

test('passwords are stored as verifiable bcrypt hashes rather than plaintext', async () => {
  const plaintext = 'correct horse battery staple';
  const hash = await hashPassword(plaintext);

  assert.notEqual(hash, plaintext);
  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(await comparePassword(plaintext, hash), true);
  assert.equal(await comparePassword('wrong password', hash), false);
});
