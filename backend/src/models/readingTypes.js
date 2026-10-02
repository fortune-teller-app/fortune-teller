// Values stored in reading_session.session_type and reading_session.status.
// The database enforces the same lists (reading_session_session_type_check and
// reading_session_status_check in database/schema.sql and migration 002), so a
// change here needs a matching migration.
//
// These are data values only. Display labels and icons belong to the frontend
// (frontend/lib/api/readings.js PRACTICE_META), keyed by these same values.

const READING_TYPES = Object.freeze({
  TAROT: "tarot",
  PALMISTRY: "palmistry",
  ASTROLOGY: "astrology",
  DREAM: "dream",
  DAILY: "daily",
});

// Readings are only written once their result exists, so "completed" is the
// only status stored today. Add pending/failed here (and in a migration) if an
// asynchronous reading flow is introduced.
const READING_STATUSES = Object.freeze({
  COMPLETED: "completed",
});

const READING_TYPE_VALUES = Object.freeze(Object.values(READING_TYPES));
const READING_STATUS_VALUES = Object.freeze(Object.values(READING_STATUSES));

// Mirrors reading_session.title VARCHAR(255).
const READING_TITLE_MAX_LENGTH = 255;

function isReadingType(value) {
  return READING_TYPE_VALUES.includes(value);
}

module.exports = {
  READING_TYPES,
  READING_STATUSES,
  READING_TYPE_VALUES,
  READING_STATUS_VALUES,
  READING_TITLE_MAX_LENGTH,
  isReadingType,
};
