// The practice-independent shape of a reading, built from its reading_session
// row. Every practice's API returns these fields, keyed by reading_session.id,
// and adds its own detail alongside them.
//
//   {
//     id,          // reading_session.id — the one public id of a reading
//     practice,    // reading_session.session_type (see readingTypes.js)
//     title,
//     summary,
//     tags,        // short descriptors derived from the practice detail; not stored
//     status,
//     createdAt,
//     completedAt,
//   }

// Columns of reading_session needed to build a summary.
const READING_SUMMARY_COLUMNS = "id, session_type, title, summary, status, created_at, completed_at";

function toReadingSummary(session, { tags = [] } = {}) {
  return {
    id: session.id,
    practice: session.session_type,
    title: session.title ?? null,
    summary: session.summary ?? null,
    tags,
    status: session.status,
    createdAt: session.created_at,
    completedAt: session.completed_at ?? null,
  };
}

module.exports = { READING_SUMMARY_COLUMNS, toReadingSummary };
