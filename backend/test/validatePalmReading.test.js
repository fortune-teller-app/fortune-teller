const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateCreatePalmReading,
  validatePalmReadingId,
} = require('../src/middleware/validatePalmReading');

function runValidation(validation, req) {
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

const VALID_URL = 'https://storage.example.com/palms/scan-1.jpg';

test('palm reading validation requires an image URL', async (t) => {
  for (const [label, body] of [
    ['missing body', undefined],
    ['missing field', {}],
    ['empty string', { imageUrl: '   ' }],
    ['non-string', { imageUrl: 42 }],
  ]) {
    await t.test(label, () => {
      const { res, nextCalled } = runValidation(validateCreatePalmReading, { body });
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error.code, 'MISSING_IMAGE_URL');
      assert.equal(nextCalled, false);
    });
  }
});

test('palm reading validation only accepts https image URLs', async (t) => {
  for (const imageUrl of [
    'not a url',
    'http://storage.example.com/palm.jpg',
    'file:///etc/passwd',
    'data:image/png;base64,AAAA',
    'javascript:alert(1)',
  ]) {
    await t.test(imageUrl, () => {
      const { res, nextCalled } = runValidation(validateCreatePalmReading, { body: { imageUrl } });
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error.code, 'INVALID_IMAGE_URL');
      assert.equal(nextCalled, false);
    });
  }
});

test('palm reading validation rejects overly long image URLs', () => {
  const imageUrl = `https://storage.example.com/${'a'.repeat(2048)}`;
  const { res, nextCalled } = runValidation(validateCreatePalmReading, { body: { imageUrl } });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, 'IMAGE_URL_TOO_LONG');
  assert.equal(nextCalled, false);
});

test('palm reading validation only accepts a left or right hand', async (t) => {
  for (const handType of ['middle', '', 7, ['left']]) {
    await t.test(JSON.stringify(handType), () => {
      const { res, nextCalled } = runValidation(validateCreatePalmReading, {
        body: { imageUrl: VALID_URL, handType },
      });
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error.code, 'INVALID_HAND_TYPE');
      assert.equal(nextCalled, false);
    });
  }
});

test('palm reading validation passes a complete payload and trims the URL', async (t) => {
  for (const handType of [undefined, null, 'left', 'RIGHT']) {
    await t.test(String(handType), () => {
      const req = { body: { imageUrl: `  ${VALID_URL}  `, handType } };
      const { res, nextCalled } = runValidation(validateCreatePalmReading, req);
      assert.equal(res.statusCode, 200);
      assert.equal(nextCalled, true);
      assert.equal(req.body.imageUrl, VALID_URL);
    });
  }
});

test('palm reading id validation requires a UUID', () => {
  const invalid = runValidation(validatePalmReadingId, { params: { id: 'reading-1' } });
  assert.equal(invalid.res.statusCode, 400);
  assert.equal(invalid.res.body.error.code, 'INVALID_READING_ID');
  assert.equal(invalid.nextCalled, false);

  const valid = runValidation(validatePalmReadingId, {
    params: { id: '7d1f3c2a-9b4e-4f6a-8c1d-2e3f4a5b6c7d' },
  });
  assert.equal(valid.nextCalled, true);
});
