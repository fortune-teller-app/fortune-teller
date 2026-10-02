const HAND_TYPES = new Set(["left", "right"]);
const IMAGE_URL_MAX_LENGTH = 2048;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function badRequest(res, code, message) {
  return res.status(400).json({ error: { code, message } });
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateCreatePalmReading(req, res, next) {
  const { imageUrl, handType } = req.body || {};

  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return badRequest(res, "MISSING_IMAGE_URL", "A palm image is required.");
  }
  if (imageUrl.length > IMAGE_URL_MAX_LENGTH) {
    return badRequest(res, "IMAGE_URL_TOO_LONG", "Image URL is too long.");
  }
  // https only: the analyzer will fetch this URL, so plain-http and other
  // schemes (file:, data:, internal hosts over http) are refused up front.
  if (!isHttpsUrl(imageUrl.trim())) {
    return badRequest(res, "INVALID_IMAGE_URL", "Image URL must be a valid https URL.");
  }

  if (handType !== undefined && handType !== null) {
    if (typeof handType !== "string" || !HAND_TYPES.has(handType.toLowerCase())) {
      return badRequest(res, "INVALID_HAND_TYPE", "Hand must be either left or right.");
    }
  }

  req.body.imageUrl = imageUrl.trim();
  next();
}

function validatePalmReadingId(req, res, next) {
  if (!UUID_PATTERN.test(req.params.id || "")) {
    return badRequest(res, "INVALID_READING_ID", "Invalid palm reading id.");
  }
  next();
}

module.exports = { validateCreatePalmReading, validatePalmReadingId };
