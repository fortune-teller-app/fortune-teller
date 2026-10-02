const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createSupabaseMock, actionArgs } = require('./helpers/supabaseMock');

// Exercises the real Express routing, authenticate middleware, validation,
// controller, and service. Only Supabase (and, per test, the analyzer) are stubbed.
const TEST_SECRET = 'palm-routes-test-secret';
const IMAGE_URL = 'https://storage.example.com/palms/scan-1.jpg';
const READING_ID = '7d1f3c2a-9b4e-4f6a-8c1d-2e3f4a5b6c7d';

const supabasePath = require.resolve('../src/config/supabase');
const analysisPath = require.resolve('../src/services/palmAnalysisService');

let supabase = createSupabaseMock();
require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { from: (table) => supabase.from(table) },
};

const realAnalysis = require(analysisPath);
let analyzePalm = realAnalysis.analyzePalm;
require.cache[analysisPath] = {
  id: analysisPath,
  filename: analysisPath,
  loaded: true,
  exports: {
    analyzePalm: (...args) => analyzePalm(...args),
    PalmAnalysisUnavailableError: realAnalysis.PalmAnalysisUnavailableError,
  },
};

const app = require('../src/app');

let server;
let baseUrl;
let originalSecret;

test.before(async () => {
  originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;
  server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test.afterEach(() => {
  analyzePalm = realAnalysis.analyzePalm;
});

function tokenFor(userId) {
  return jwt.sign({ sub: userId, email: `${userId}@example.com`, jti: `jti-${userId}` }, TEST_SECRET, { expiresIn: '5m' });
}

// The first Supabase call on every authenticated request is the revocation lookup.
const NOT_REVOKED = { data: null, error: null };

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

function dataCalls() {
  return supabase.calls.filter((call) => call.table !== 'revoked_tokens');
}

test('every palm reading endpoint requires authentication', async () => {
  supabase = createSupabaseMock();

  for (const [method, path] of [
    ['POST', '/api/palm/readings'],
    ['GET', '/api/palm/readings'],
    ['GET', `/api/palm/readings/${READING_ID}`],
  ]) {
    const missing = await api(path, { method, body: method === 'POST' ? { imageUrl: IMAGE_URL } : undefined });
    assert.equal(missing.status, 401, `${method} ${path}`);
    assert.equal(missing.data.error.code, 'UNAUTHORIZED');

    const invalid = await api(path, { method, token: 'not-a-jwt' });
    assert.equal(invalid.status, 401, `${method} ${path}`);
    assert.equal(invalid.data.error.code, 'INVALID_TOKEN');
  }

  assert.equal(supabase.calls.length, 0);
});

test('a revoked token cannot create palm readings', async () => {
  supabase = createSupabaseMock([{ data: { id: 'revocation-1' }, error: null }]);
  let analysed = false;
  analyzePalm = async () => { analysed = true; };

  const response = await api('/api/palm/readings', {
    method: 'POST',
    token: tokenFor('user-a'),
    body: { imageUrl: IMAGE_URL },
  });

  assert.equal(response.status, 401);
  assert.equal(response.data.error.code, 'TOKEN_REVOKED');
  assert.equal(analysed, false);
});

test('invalid payloads are rejected before analysis or storage', async () => {
  let analysed = false;
  analyzePalm = async () => { analysed = true; };

  for (const [body, code] of [
    [{}, 'MISSING_IMAGE_URL'],
    [{ imageUrl: 'http://storage.example.com/palm.jpg' }, 'INVALID_IMAGE_URL'],
    [{ imageUrl: IMAGE_URL, handType: 'both' }, 'INVALID_HAND_TYPE'],
  ]) {
    supabase = createSupabaseMock([NOT_REVOKED]);
    const response = await api('/api/palm/readings', { method: 'POST', token: tokenFor('user-a'), body });
    assert.equal(response.status, 400);
    assert.equal(response.data.error.code, code);
    assert.deepEqual(dataCalls(), []);
  }

  supabase = createSupabaseMock([NOT_REVOKED]);
  const badId = await api('/api/palm/readings/not-a-uuid', { token: tokenFor('user-a') });
  assert.equal(badId.status, 400);
  assert.equal(badId.data.error.code, 'INVALID_READING_ID');
  assert.deepEqual(dataCalls(), []);

  assert.equal(analysed, false);
});

test('until the AI analyzer is connected, creating a reading returns 503 and stores nothing', async () => {
  supabase = createSupabaseMock([NOT_REVOKED]);

  const response = await api('/api/palm/readings', {
    method: 'POST',
    token: tokenFor('user-a'),
    body: { imageUrl: IMAGE_URL, handType: 'right' },
  });

  assert.equal(response.status, 503);
  assert.deepEqual(response.data, {
    error: {
      code: 'PALM_ANALYSIS_UNAVAILABLE',
      message: 'Palm reading is not available yet. Please try again later.',
    },
  });
  assert.deepEqual(dataCalls(), []);
});

const CREATED_AT = '2026-10-01T10:00:00.000Z';

const SESSION_ROW = {
  id: READING_ID,
  session_type: 'palmistry',
  title: 'Right palm reading',
  summary: 'An intuitive reading.',
  status: 'completed',
  created_at: CREATED_AT,
  completed_at: CREATED_AT,
};

const DETAIL_ROW = {
  hand_shape: 'Water',
  life_line: null,
  heart_line: null,
  head_line: null,
  fate_line: null,
  interpretation: 'An intuitive reading.',
};

const PUBLIC_READING = {
  id: READING_ID,
  practice: 'palmistry',
  title: 'Right palm reading',
  summary: 'An intuitive reading.',
  tags: ['Right hand'],
  status: 'completed',
  createdAt: CREATED_AT,
  completedAt: CREATED_AT,
  details: {
    handType: 'right',
    imageUrl: IMAGE_URL,
    handShape: 'Water',
    lifeLine: null,
    heartLine: null,
    headLine: null,
    fateLine: null,
    interpretation: 'An intuitive reading.',
  },
};

test('a created reading belongs to the token owner, never a userId in the body', async () => {
  analyzePalm = async () => ({ handShape: 'Water', interpretation: 'An intuitive reading.' });
  supabase = createSupabaseMock([
    NOT_REVOKED,
    { data: { id: 'scan-1', image_url: IMAGE_URL, hand_type: 'right' }, error: null },
    { data: SESSION_ROW, error: null },
    { data: DETAIL_ROW, error: null },
  ]);

  const response = await api('/api/palm/readings', {
    method: 'POST',
    token: tokenFor('user-a'),
    body: { imageUrl: IMAGE_URL, handType: 'right', userId: 'user-b', user_id: 'user-b' },
  });

  assert.equal(response.status, 201, JSON.stringify(response.data));
  const [scanInsert, sessionInsert] = dataCalls().map((call) => actionArgs(call, 'insert')[0]);
  assert.equal(scanInsert.user_id, 'user-a');
  assert.equal(sessionInsert.user_id, 'user-a');
  assert.equal(sessionInsert.title, 'Right palm reading');
  assert.equal(sessionInsert.summary, 'An intuitive reading.');

  assert.deepEqual(response.data, { reading: PUBLIC_READING });
});

test('reading lists are scoped to the token owner regardless of query parameters', async () => {
  supabase = createSupabaseMock([
    NOT_REVOKED,
    {
      data: [{
        ...SESSION_ROW,
        palm_reading: [{ ...DETAIL_ROW, palm_scan: { image_url: IMAGE_URL, hand_type: 'right' } }],
      }],
      error: null,
    },
  ]);

  const response = await api('/api/palm/readings?userId=user-b', { token: tokenFor('user-a') });

  assert.equal(response.status, 200);
  assert.deepEqual(response.data, { readings: [PUBLIC_READING] });
  const [listCall] = dataCalls();
  assert.equal(listCall.table, 'reading_session');
  const filters = listCall.actions.filter((action) => action.method === 'eq').map((action) => action.args);
  assert.deepEqual(filters, [['user_id', 'user-a'], ['session_type', 'palmistry']]);
});

test("another user's reading id returns 404, not their data", async () => {
  supabase = createSupabaseMock([NOT_REVOKED, { data: null, error: null }]);

  const response = await api(`/api/palm/readings/${READING_ID}?userId=user-b`, { token: tokenFor('user-a') });

  assert.equal(response.status, 404);
  assert.equal(response.data.error.code, 'READING_NOT_FOUND');
  const filters = dataCalls()[0].actions.filter((action) => action.method === 'eq').map((action) => action.args);
  assert.deepEqual(filters, [['id', READING_ID], ['user_id', 'user-a'], ['session_type', 'palmistry']]);
});

test('a reading is fetched by the same id the create response returned', async () => {
  supabase = createSupabaseMock([
    NOT_REVOKED,
    {
      data: {
        ...SESSION_ROW,
        palm_reading: [{ ...DETAIL_ROW, palm_scan: { image_url: IMAGE_URL, hand_type: 'right' } }],
      },
      error: null,
    },
  ]);

  const response = await api(`/api/palm/readings/${READING_ID}`, { token: tokenFor('user-a') });

  assert.equal(response.status, 200);
  assert.deepEqual(response.data, { reading: PUBLIC_READING });
});
