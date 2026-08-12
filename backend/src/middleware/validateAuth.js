function isValidEmail(email) {
  return typeof email === "string" && /\S+@\S+\.\S+/.test(email);
}

function badRequest(res, code, message) {
  return res.status(400).json({ error: { code, message } });
}

function validateRegister(req, res, next) {
  const { name, birthDate, email, password } = req.body || {};

  if (!name || !String(name).trim()) {
    return badRequest(res, "MISSING_NAME", "Name is required.");
  }
  if (!birthDate || !String(birthDate).trim()) {
    return badRequest(res, "MISSING_BIRTH_DATE", "Date of birth is required.");
  }
  if (!isValidEmail(email)) {
    return badRequest(res, "INVALID_EMAIL", "Enter a valid email address.");
  }
  if (!password || password.length < 8) {
    return badRequest(res, "WEAK_PASSWORD", "Password must be at least 8 characters.");
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!isValidEmail(email)) {
    return badRequest(res, "INVALID_EMAIL", "Enter a valid email address.");
  }
  if (!password) {
    return badRequest(res, "MISSING_PASSWORD", "Enter your password.");
  }

  next();
}

module.exports = { validateRegister, validateLogin };
