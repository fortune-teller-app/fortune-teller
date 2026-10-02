const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  READING_TYPES,
  READING_STATUSES,
  READING_TYPE_VALUES,
  READING_STATUS_VALUES,
  isReadingType,
} = require('../src/models/readingTypes');
const { toReadingSummary } = require('../src/models/readingSummary');

const DATABASE_DIR = path.resolve(__dirname, '../database');

function checkValues(sql, constraintName) {
  const match = sql.match(new RegExp(`${constraintName}\\s+CHECK\\s*\\(\\s*\\w+\\s+IN\\s*\\(([^)]*)\\)`, 'i'));
  assert.ok(match, `${constraintName} not found`);
  return match[1].split(',').map((value) => value.trim().replace(/^'|'$/g, ''));
}

test('reading types match the practice keys the frontend uses', () => {
  assert.deepEqual(READING_TYPE_VALUES, ['tarot', 'palmistry', 'astrology', 'dream', 'daily']);
  assert.equal(READING_TYPES.PALMISTRY, 'palmistry');
  assert.deepEqual(READING_STATUS_VALUES, ['completed']);
  assert.equal(READING_STATUSES.COMPLETED, 'completed');
});

test('reading type definitions cannot be mutated at runtime', () => {
  assert.ok(Object.isFrozen(READING_TYPES));
  assert.ok(Object.isFrozen(READING_STATUSES));
  assert.ok(Object.isFrozen(READING_TYPE_VALUES));
});

test('isReadingType accepts only defined practices', () => {
  for (const value of READING_TYPE_VALUES) assert.equal(isReadingType(value), true);
  for (const value of ['palm', 'Tarot', '', null, undefined]) assert.equal(isReadingType(value), false);
});

test('database constraints allow exactly the values defined in readingTypes.js', async (t) => {
  for (const file of ['schema.sql', 'migrations/002_reading_structure.sql']) {
    await t.test(file, () => {
      const sql = fs.readFileSync(path.join(DATABASE_DIR, file), 'utf8');
      assert.deepEqual(checkValues(sql, 'reading_session_session_type_check'), [...READING_TYPE_VALUES]);
      assert.deepEqual(checkValues(sql, 'reading_session_status_check'), [...READING_STATUS_VALUES]);
    });
  }
});

test('toReadingSummary maps a reading_session row to the shared reading shape', () => {
  const summary = toReadingSummary({
    id: 'session-1',
    user_id: 'user-a',
    session_type: 'tarot',
    title: 'Three of Cups',
    summary: 'A reading about friendship.',
    status: 'completed',
    created_at: '2026-10-01T10:00:00.000Z',
    completed_at: '2026-10-01T10:01:00.000Z',
  }, { tags: ['3 cards'] });

  assert.deepEqual(summary, {
    id: 'session-1',
    practice: 'tarot',
    title: 'Three of Cups',
    summary: 'A reading about friendship.',
    tags: ['3 cards'],
    status: 'completed',
    createdAt: '2026-10-01T10:00:00.000Z',
    completedAt: '2026-10-01T10:01:00.000Z',
  });
  assert.equal('user_id' in summary, false);
});

test('toReadingSummary defaults missing optional fields', () => {
  const summary = toReadingSummary({
    id: 'session-2',
    session_type: 'dream',
    status: 'completed',
    created_at: '2026-10-01T10:00:00.000Z',
  });

  assert.equal(summary.title, null);
  assert.equal(summary.summary, null);
  assert.deepEqual(summary.tags, []);
  assert.equal(summary.completedAt, null);
});
