const supabase = require("../config/supabase");
const palmAnalysis = require("./palmAnalysisService");
const { READING_TYPES, READING_STATUSES } = require("../models/readingTypes");
const { READING_SUMMARY_COLUMNS, toReadingSummary } = require("../models/readingSummary");

const HAND_SHAPE_MAX_LENGTH = 100;
const SUMMARY_MAX_LENGTH = 200;

const DETAIL_COLUMNS = "hand_shape, life_line, heart_line, head_line, fate_line, interpretation";

// A palm reading is a reading_session (owned through its user_id) with exactly
// one palm_reading. !inner drops sessions whose detail row is missing.
const SESSION_COLUMNS =
  `${READING_SUMMARY_COLUMNS}, palm_reading!inner(${DETAIL_COLUMNS}, palm_scan(image_url, hand_type))`;

const HAND_LABELS = { left: "Left", right: "Right" };

class PalmReadingError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "PalmReadingError";
    this.status = status;
    this.code = code;
  }
}

function optionalText(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

// Guards the database against a malformed analyzer result instead of storing it.
function normalizeAnalysis(result) {
  if (!result || typeof result !== "object") return null;

  const interpretation = optionalText(result.interpretation);
  if (!interpretation) return null;

  const fields = {
    hand_shape: optionalText(result.handShape),
    life_line: optionalText(result.lifeLine),
    heart_line: optionalText(result.heartLine),
    head_line: optionalText(result.headLine),
    fate_line: optionalText(result.fateLine),
  };
  if (Object.values(fields).some((value) => value === undefined)) return null;
  if (fields.hand_shape && fields.hand_shape.length > HAND_SHAPE_MAX_LENGTH) return null;

  return { ...fields, interpretation };
}

function buildTitle(handType) {
  return HAND_LABELS[handType] ? `${HAND_LABELS[handType]} palm reading` : "Palm reading";
}

// The interpretation, shortened at a word boundary for reading lists.
function buildSummary(interpretation) {
  const text = interpretation.replace(/\s+/g, " ").trim();
  if (text.length <= SUMMARY_MAX_LENGTH) return text;

  const cut = text.slice(0, SUMMARY_MAX_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
}

function buildTags(handType) {
  return HAND_LABELS[handType] ? [`${HAND_LABELS[handType]} hand`] : [];
}

function toPublicReading(session, detail, scan) {
  const handType = scan?.hand_type ?? null;
  return {
    ...toReadingSummary(session, { tags: buildTags(handType) }),
    details: {
      handType,
      imageUrl: scan?.image_url ?? null,
      handShape: detail.hand_shape,
      lifeLine: detail.life_line,
      heartLine: detail.heart_line,
      headLine: detail.head_line,
      fateLine: detail.fate_line,
      interpretation: detail.interpretation,
    },
  };
}

function fromSessionRow(row) {
  // palm_reading is embedded as a list (session_id is not unique in the schema).
  const detail = Array.isArray(row.palm_reading) ? row.palm_reading[0] : row.palm_reading;
  return toPublicReading(row, detail, detail.palm_scan);
}

async function runAnalysis(input) {
  let result;
  try {
    result = await palmAnalysis.analyzePalm(input);
  } catch (err) {
    if (err instanceof palmAnalysis.PalmAnalysisUnavailableError) {
      throw new PalmReadingError(503, "PALM_ANALYSIS_UNAVAILABLE", "Palm reading is not available yet. Please try again later.");
    }
    console.error("PALM ANALYSIS ERROR:", err);
    throw new PalmReadingError(502, "PALM_ANALYSIS_FAILED", "Could not read this palm. Please try again.");
  }

  const analysis = normalizeAnalysis(result);
  if (!analysis) {
    console.error("PALM ANALYSIS RETURNED AN INVALID RESULT");
    throw new PalmReadingError(502, "PALM_ANALYSIS_FAILED", "Could not read this palm. Please try again.");
  }
  return analysis;
}

async function createPalmReading(userId, { imageUrl, handType }) {
  const normalizedHandType = handType ? String(handType).toLowerCase() : null;

  // Analyse before writing anything, so an unavailable or failed analysis
  // leaves no scan or session behind.
  const analysis = await runAnalysis({ imageUrl, handType: normalizedHandType });

  const { data: scan, error: scanError } = await supabase
    .from("palm_scan")
    .insert({ user_id: userId, image_url: imageUrl, hand_type: normalizedHandType })
    .select("id, image_url, hand_type")
    .single();

  if (scanError) {
    throw new PalmReadingError(500, "DB_ERROR", "Could not save palm scan.");
  }

  const { data: session, error: sessionError } = await supabase
    .from("reading_session")
    .insert({
      user_id: userId,
      session_type: READING_TYPES.PALMISTRY,
      title: buildTitle(normalizedHandType),
      summary: buildSummary(analysis.interpretation),
      status: READING_STATUSES.COMPLETED,
      completed_at: new Date().toISOString(),
    })
    .select(READING_SUMMARY_COLUMNS)
    .single();

  if (sessionError) {
    await supabase.from("palm_scan").delete().eq("id", scan.id);
    throw new PalmReadingError(500, "DB_ERROR", "Could not save palm reading.");
  }

  const { data: detail, error: readingError } = await supabase
    .from("palm_reading")
    .insert({ session_id: session.id, palm_scan_id: scan.id, ...analysis })
    .select(DETAIL_COLUMNS)
    .single();

  if (readingError) {
    // Roll back so a failed save doesn't leave an empty session counted in reading stats.
    await supabase.from("reading_session").delete().eq("id", session.id);
    await supabase.from("palm_scan").delete().eq("id", scan.id);
    throw new PalmReadingError(500, "DB_ERROR", "Could not save palm reading.");
  }

  return toPublicReading(session, detail, scan);
}

async function listPalmReadings(userId) {
  const { data, error } = await supabase
    .from("reading_session")
    .select(SESSION_COLUMNS)
    .eq("user_id", userId)
    .eq("session_type", READING_TYPES.PALMISTRY)
    .order("created_at", { ascending: false });

  if (error) {
    throw new PalmReadingError(500, "DB_ERROR", "Could not load palm readings.");
  }

  return (data ?? []).map(fromSessionRow);
}

async function getPalmReading(userId, readingId) {
  const { data, error } = await supabase
    .from("reading_session")
    .select(SESSION_COLUMNS)
    .eq("id", readingId)
    .eq("user_id", userId)
    .eq("session_type", READING_TYPES.PALMISTRY)
    .maybeSingle();

  if (error) {
    throw new PalmReadingError(500, "DB_ERROR", "Could not load palm reading.");
  }
  // Another user's reading is indistinguishable from a missing one.
  if (!data) {
    throw new PalmReadingError(404, "READING_NOT_FOUND", "Palm reading not found.");
  }

  return fromSessionRow(data);
}

module.exports = { createPalmReading, listPalmReadings, getPalmReading, PalmReadingError };
