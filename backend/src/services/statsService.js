const supabase = require("../config/supabase");

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// "Readings" = every reading_session row (tarot/palmistry/astrology/dream/daily interpretations).
// "Dreams" = dream_entry rows, which have their own user_id and represent the raw dream journal —
// a user can journal a dream without ever running an interpretation session, so this is tracked
// separately rather than as a subset of reading_session.
async function getReadingStatsByUserId(userId) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new Error("Could not load account age.");
  }

  const daysKept = user?.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(user.created_at).getTime()) / MS_PER_DAY))
    : 0;

  const { data: sessions, error: sessionsError } = await supabase
    .from("reading_session")
    .select("session_type")
    .eq("user_id", userId);

  if (sessionsError) {
    throw new Error("Could not load reading sessions.");
  }

  const mostRead = (sessions ?? []).reduce((acc, row) => {
    acc[row.session_type] = (acc[row.session_type] ?? 0) + 1;
    return acc;
  }, {});

  const { count: dreamCount, error: dreamError } = await supabase
    .from("dream_entry")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (dreamError) {
    throw new Error("Could not load dream entries.");
  }

  return {
    totalReadings: sessions?.length ?? 0,
    dreamCount: dreamCount ?? 0,
    daysKept,
    mostRead,
  };
}

module.exports = { getReadingStatsByUserId };
