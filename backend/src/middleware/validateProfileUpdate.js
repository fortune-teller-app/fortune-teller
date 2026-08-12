function isValidEmail(email) {
  return typeof email === "string" && /\S+@\S+\.\S+/.test(email);
}

function badRequest(res, code, message) {
  return res.status(400).json({ error: { code, message } });
}

function validateProfileUpdate(req, res, next) {
  const { name, email, birthDate, birthPlace } = req.body || {};

  const hasAnyField = [name, email, birthDate, birthPlace].some((v) => v !== undefined);
  if (!hasAnyField) {
    return badRequest(res, "NO_FIELDS", "No fields provided to update.");
  }

  if (name !== undefined) {
    if (!String(name).trim()) {
      return badRequest(res, "MISSING_NAME", "Name cannot be empty.");
    }
    if (String(name).trim().length > 100) {
      return badRequest(res, "NAME_TOO_LONG", "Name must be 100 characters or fewer.");
    }
  }

  if (email !== undefined && !isValidEmail(email)) {
    return badRequest(res, "INVALID_EMAIL", "Enter a valid email address.");
  }

  if (birthDate !== undefined) {
    if (!String(birthDate).trim()) {
      return badRequest(res, "MISSING_BIRTH_DATE", "Birth date is required.");
    }
    if (Number.isNaN(new Date(birthDate).getTime())) {
      return badRequest(res, "INVALID_BIRTH_DATE", "Enter a valid date.");
    }
  }

  if (birthPlace !== undefined && String(birthPlace).length > 100) {
    return badRequest(res, "BIRTH_PLACE_TOO_LONG", "Birth place must be 100 characters or fewer.");
  }

  next();
}

module.exports = validateProfileUpdate;
