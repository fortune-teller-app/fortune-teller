const test = require('node:test');
const assert = require('node:assert/strict');
const { afterEach } = require('node:test');
const { createSupabaseMock, actionArgs } = require('./helpers/supabaseMock');

const modulePaths = {
  service: require.resolve('../src/services/palmReadingService'),
  supabase: require.resolve('../src/config/supabase'),
  analysis: require.resolve('../src/services/palmAnalysisService'),
};

const { PalmAnalysisUnavailableError } = require(modulePaths.analysis);

function putInRequireCache(path, exports) {
  require.cache[path] = { id: path, filename: path, loaded: true, exports };
}

function loadPalmReadingService({ supabase, analyzePalm }) {
  delete require.cache[modulePaths.service];
  putInRequireCache(modulePaths.supabase, supabase);
  putInRequireCache(modulePaths.analysis, { analyzePalm, PalmAnalysisUnavailableError });
  return require(modulePaths.service);
}

function silenceConsoleError(t) {
  const original = console.error;
  console.error = () => {};
  t.after(() => { console.error = original; });
}

function eqFilters(call) {
  return call.actions.filter((action) => action.method === 'eq').map((action) => action.args);
}

afterEach(() => {
  delete require.cache[modulePaths.service];
  delete require.cache[modulePaths.supabase];
  delete require.cache[modulePaths.analysis];
});

const IMAGE_URL = 'https://storage.example.com/palms/upload-7.jpg';
const CREATED_AT = '2026-10-01T10:00:00.000Z';

const ANALYSIS = {
  handShape: 'Earth',
  lifeLine: 'Long and deep.',
  heartLine: 'Curved upward.',
  headLine: 'Straight and clear.',
  fateLine: null,
  interpretation: 'A grounded, steady temperament.',
};

const SCAN_ROW = { id: 'scan-1', image_url: IMAGE_URL, hand_type: 'left' };

const SESSION_ROW = {
  id: 'session-1',
  session_type: 'palmistry',
  title: 'Left palm reading',
  summary: 'A grounded, steady temperament.',
  status: 'completed',
  created_at: CREATED_AT,
  completed_at: CREATED_AT,
};

const DETAIL_ROW = {
  hand_shape: 'Earth',
  life_line: 'Long and deep.',
  heart_line: 'Curved upward.',
  head_line: 'Straight and clear.',
  fate_line: null,
  interpretation: 'A grounded, steady temperament.',
};

// Shape of a reading_session row with palm_reading and palm_scan embedded.
const LISTED_ROW = {
  ...SESSION_ROW,
  palm_reading: [{ ...DETAIL_ROW, palm_scan: { image_url: IMAGE_URL, hand_type: 'left' } }],
};

const PUBLIC_READING = {
  id: 'session-1',
  practice: 'palmistry',
  title: 'Left palm reading',
  summary: 'A grounded, steady temperament.',
  tags: ['Left hand'],
  status: 'completed',
  createdAt: CREATED_AT,
  completedAt: CREATED_AT,
  details: {
    handType: 'left',
    imageUrl: IMAGE_URL,
    handShape: 'Earth',
    lifeLine: 'Long and deep.',
    heartLine: 'Curved upward.',
    headLine: 'Straight and clear.',
    fateLine: null,
    interpretation: 'A grounded, steady temperament.',
  },
};

function successfulCreateResponses({ scan = SCAN_ROW, session = SESSION_ROW, detail = DETAIL_ROW } = {}) {
  return [
    { data: scan, error: null },
    { data: session, error: null },
    { data: detail, error: null },
  ];
}

test('creating a reading analyses the image, then stores scan, session, and detail for the given user', async () => {
  const analysed = [];
  const supabase = createSupabaseMock(successfulCreateResponses());
  const service = loadPalmReadingService({
    supabase,
    analyzePalm: async (input) => {
      analysed.push(input);
      return ANALYSIS;
    },
  });

  const reading = await service.createPalmReading('user-a', { imageUrl: IMAGE_URL, handType: 'LEFT' });

  assert.deepEqual(analysed, [{ imageUrl: IMAGE_URL, handType: 'left' }]);
  assert.deepEqual(supabase.calls.map((call) => call.table), ['palm_scan', 'reading_session', 'palm_reading']);
  assert.deepEqual(actionArgs(supabase.calls[0], 'insert'), [{
    user_id: 'user-a',
    image_url: IMAGE_URL,
    hand_type: 'left',
  }]);

  const [sessionInsert] = actionArgs(supabase.calls[1], 'insert');
  assert.equal(sessionInsert.user_id, 'user-a');
  assert.equal(sessionInsert.session_type, 'palmistry');
  assert.equal(sessionInsert.title, 'Left palm reading');
  assert.equal(sessionInsert.summary, 'A grounded, steady temperament.');
  assert.equal(sessionInsert.status, 'completed');
  assert.ok(!Number.isNaN(new Date(sessionInsert.completed_at).getTime()));

  assert.deepEqual(actionArgs(supabase.calls[2], 'insert'), [{
    session_id: 'session-1',
    palm_scan_id: 'scan-1',
    hand_shape: 'Earth',
    life_line: 'Long and deep.',
    heart_line: 'Curved upward.',
    head_line: 'Straight and clear.',
    fate_line: null,
    interpretation: 'A grounded, steady temperament.',
  }]);

  assert.deepEqual(reading, PUBLIC_READING);
});

test('a created reading is identified by its reading_session id and exposes no internal ids', async () => {
  const supabase = createSupabaseMock(successfulCreateResponses());
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  const reading = await service.createPalmReading('user-a', { imageUrl: IMAGE_URL, handType: 'left' });

  assert.equal(reading.id, 'session-1');
  const serialized = JSON.stringify(reading);
  for (const internal of ['user-a', 'scan-1', 'user_id', 'session_id', 'palm_scan_id']) {
    assert.equal(serialized.includes(internal), false, `response must not include ${internal}`);
  }
});

test('without a hand type the reading gets a generic title and no tags', async () => {
  const supabase = createSupabaseMock(successfulCreateResponses({
    scan: { ...SCAN_ROW, hand_type: null },
    session: { ...SESSION_ROW, title: 'Palm reading' },
  }));
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  const reading = await service.createPalmReading('user-a', { imageUrl: IMAGE_URL });

  assert.equal(actionArgs(supabase.calls[0], 'insert')[0].hand_type, null);
  assert.equal(actionArgs(supabase.calls[1], 'insert')[0].title, 'Palm reading');
  assert.deepEqual(reading.tags, []);
  assert.equal(reading.details.handType, null);
});

test('the right hand is titled and tagged as such', async () => {
  const supabase = createSupabaseMock(successfulCreateResponses({ scan: { ...SCAN_ROW, hand_type: 'right' } }));
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  const reading = await service.createPalmReading('user-a', { imageUrl: IMAGE_URL, handType: 'right' });

  assert.equal(actionArgs(supabase.calls[1], 'insert')[0].title, 'Right palm reading');
  assert.deepEqual(reading.tags, ['Right hand']);
});

test('a long interpretation is summarised at a word boundary within 200 characters', async () => {
  const interpretation = `${'The heart line rises steadily toward the index finger. '.repeat(8)}   `;
  const supabase = createSupabaseMock(successfulCreateResponses());
  const service = loadPalmReadingService({
    supabase,
    analyzePalm: async () => ({ ...ANALYSIS, interpretation }),
  });

  await service.createPalmReading('user-a', { imageUrl: IMAGE_URL });

  const { summary } = actionArgs(supabase.calls[1], 'insert')[0];
  assert.ok(summary.length <= 200, `summary is ${summary.length} characters`);
  assert.ok(summary.endsWith('…'));
  assert.ok(interpretation.startsWith(summary.slice(0, -1)));
  assert.equal(actionArgs(supabase.calls[2], 'insert')[0].interpretation, interpretation.trim());
});

test('an unavailable analyzer returns 503 and writes nothing', async () => {
  const supabase = createSupabaseMock([]);
  const service = loadPalmReadingService({
    supabase,
    analyzePalm: async () => { throw new PalmAnalysisUnavailableError(); },
  });

  await assert.rejects(
    () => service.createPalmReading('user-a', { imageUrl: IMAGE_URL }),
    (error) => error.status === 503 && error.code === 'PALM_ANALYSIS_UNAVAILABLE'
  );
  assert.equal(supabase.calls.length, 0);
});

test('the default analyzer reports itself unavailable rather than inventing a reading', async () => {
  delete require.cache[modulePaths.analysis];
  const realAnalysis = require(modulePaths.analysis);

  await assert.rejects(
    () => realAnalysis.analyzePalm({ imageUrl: IMAGE_URL, handType: null }),
    realAnalysis.PalmAnalysisUnavailableError
  );
});

test('a failing analyzer returns 502 without leaking its error and writes nothing', async (t) => {
  silenceConsoleError(t);
  const supabase = createSupabaseMock([]);
  const service = loadPalmReadingService({
    supabase,
    analyzePalm: async () => { throw new Error('provider timeout: key sk-123'); },
  });

  await assert.rejects(
    () => service.createPalmReading('user-a', { imageUrl: IMAGE_URL }),
    (error) => error.status === 502
      && error.code === 'PALM_ANALYSIS_FAILED'
      && !error.message.includes('sk-123')
  );
  assert.equal(supabase.calls.length, 0);
});

test('a malformed analyzer result returns 502 and writes nothing', async (t) => {
  silenceConsoleError(t);
  for (const [label, result] of [
    ['no result', undefined],
    ['missing interpretation', { ...ANALYSIS, interpretation: undefined }],
    ['blank interpretation', { ...ANALYSIS, interpretation: '   ' }],
    ['non-string line', { ...ANALYSIS, lifeLine: { length: 'long' } }],
    ['hand shape too long', { ...ANALYSIS, handShape: 'x'.repeat(101) }],
  ]) {
    await t.test(label, async () => {
      const supabase = createSupabaseMock([]);
      const service = loadPalmReadingService({ supabase, analyzePalm: async () => result });

      await assert.rejects(
        () => service.createPalmReading('user-a', { imageUrl: IMAGE_URL }),
        (error) => error.status === 502 && error.code === 'PALM_ANALYSIS_FAILED'
      );
      assert.equal(supabase.calls.length, 0);
    });
  }
});

test('a failed scan insert stops before creating a session', async () => {
  const supabase = createSupabaseMock([{ data: null, error: { message: 'insert failed' } }]);
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  await assert.rejects(
    () => service.createPalmReading('user-a', { imageUrl: IMAGE_URL }),
    (error) => error.status === 500 && error.code === 'DB_ERROR'
  );
  assert.equal(supabase.calls.length, 1);
});

test('a failed session insert removes the stored scan', async () => {
  const supabase = createSupabaseMock([
    { data: SCAN_ROW, error: null },
    { data: null, error: { message: 'insert failed' } },
    { data: null, error: null },
  ]);
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  await assert.rejects(
    () => service.createPalmReading('user-a', { imageUrl: IMAGE_URL }),
    (error) => error.status === 500 && error.code === 'DB_ERROR'
  );

  assert.equal(supabase.calls[2].table, 'palm_scan');
  assert.ok(actionArgs(supabase.calls[2], 'delete'));
  assert.deepEqual(actionArgs(supabase.calls[2], 'eq'), ['id', 'scan-1']);
});

test('a failed detail insert removes both the session and the scan', async () => {
  const supabase = createSupabaseMock([
    { data: SCAN_ROW, error: null },
    { data: SESSION_ROW, error: null },
    { data: null, error: { message: 'insert failed' } },
    { data: null, error: null },
    { data: null, error: null },
  ]);
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  await assert.rejects(
    () => service.createPalmReading('user-a', { imageUrl: IMAGE_URL }),
    (error) => error.status === 500 && error.code === 'DB_ERROR'
  );

  assert.equal(supabase.calls[3].table, 'reading_session');
  assert.ok(actionArgs(supabase.calls[3], 'delete'));
  assert.deepEqual(actionArgs(supabase.calls[3], 'eq'), ['id', 'session-1']);
  assert.equal(supabase.calls[4].table, 'palm_scan');
  assert.ok(actionArgs(supabase.calls[4], 'delete'));
  assert.deepEqual(actionArgs(supabase.calls[4], 'eq'), ['id', 'scan-1']);
});

test("listing readings reads the user's palmistry sessions newest first", async () => {
  const supabase = createSupabaseMock([{ data: [LISTED_ROW], error: null }]);
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  const readings = await service.listPalmReadings('user-a');

  assert.equal(supabase.calls[0].table, 'reading_session');
  assert.match(actionArgs(supabase.calls[0], 'select')[0], /palm_reading!inner/);
  assert.deepEqual(eqFilters(supabase.calls[0]), [['user_id', 'user-a'], ['session_type', 'palmistry']]);
  assert.deepEqual(actionArgs(supabase.calls[0], 'order'), ['created_at', { ascending: false }]);
  assert.deepEqual(readings, [PUBLIC_READING]);
});

test('listing readings also accepts the detail embedded as a single object', async () => {
  const row = { ...LISTED_ROW, palm_reading: LISTED_ROW.palm_reading[0] };
  const supabase = createSupabaseMock([{ data: [row], error: null }]);
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  assert.deepEqual(await service.listPalmReadings('user-a'), [PUBLIC_READING]);
});

test('listing readings returns an empty list when the user has none', async () => {
  const supabase = createSupabaseMock([{ data: [], error: null }]);
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  assert.deepEqual(await service.listPalmReadings('user-a'), []);
});

test('fetching one reading filters by session id, owner, and practice', async () => {
  const supabase = createSupabaseMock([{ data: LISTED_ROW, error: null }]);
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  const reading = await service.getPalmReading('user-a', 'session-1');

  assert.equal(supabase.calls[0].table, 'reading_session');
  assert.deepEqual(eqFilters(supabase.calls[0]), [
    ['id', 'session-1'],
    ['user_id', 'user-a'],
    ['session_type', 'palmistry'],
  ]);
  assert.deepEqual(reading, PUBLIC_READING);
});

test('a reading that is missing, owned by someone else, or not a palm reading returns 404', async () => {
  const supabase = createSupabaseMock([{ data: null, error: null }]);
  const service = loadPalmReadingService({ supabase, analyzePalm: async () => ANALYSIS });

  await assert.rejects(
    () => service.getPalmReading('user-a', 'session-of-user-b'),
    (error) => error.status === 404 && error.code === 'READING_NOT_FOUND'
  );
});

test('database read failures return a safe 500', async (t) => {
  await t.test('list', async () => {
    const service = loadPalmReadingService({
      supabase: createSupabaseMock([{ data: null, error: { message: 'relation reading_session offline' } }]),
      analyzePalm: async () => ANALYSIS,
    });
    await assert.rejects(
      () => service.listPalmReadings('user-a'),
      (error) => error.status === 500 && error.code === 'DB_ERROR' && !error.message.includes('reading_session')
    );
  });

  await t.test('get', async () => {
    const service = loadPalmReadingService({
      supabase: createSupabaseMock([{ data: null, error: { message: 'offline' } }]),
      analyzePalm: async () => ANALYSIS,
    });
    await assert.rejects(
      () => service.getPalmReading('user-a', 'session-1'),
      (error) => error.status === 500 && error.code === 'DB_ERROR'
    );
  });
});
