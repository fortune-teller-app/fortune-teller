const test = require('node:test');
const assert = require('node:assert/strict');
const { createSupabaseMock, actionArgs } = require('./helpers/supabaseMock');

const supabasePath = require.resolve('../src/config/supabase');
let supabase = createSupabaseMock();
require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { from: (table) => supabase.from(table) },
};
const { getReadingStatsByUserId } = require('../src/services/statsService');

test('reading statistics count only defined reading types', async () => {
  supabase = createSupabaseMock([
    { data: { created_at: new Date().toISOString() }, error: null },
    {
      data: [
        { session_type: 'palmistry' },
        { session_type: 'palmistry' },
        { session_type: 'tarot' },
        { session_type: 'legacy-type' },
        { session_type: null },
      ],
      error: null,
    },
    { count: 4, error: null },
  ]);

  const stats = await getReadingStatsByUserId('user-a');

  assert.deepEqual(stats, {
    totalReadings: 3,
    dreamCount: 4,
    daysKept: 0,
    mostRead: { palmistry: 2, tarot: 1 },
  });
  assert.deepEqual(actionArgs(supabase.calls[1], 'eq'), ['user_id', 'user-a']);
});

test('reading statistics are zero for a user without readings', async () => {
  supabase = createSupabaseMock([
    { data: { created_at: new Date().toISOString() }, error: null },
    { data: [], error: null },
    { count: 0, error: null },
  ]);

  const stats = await getReadingStatsByUserId('user-a');

  assert.equal(stats.totalReadings, 0);
  assert.deepEqual(stats.mostRead, {});
});
