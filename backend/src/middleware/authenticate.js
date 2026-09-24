const { verifyToken } = require("../utils/jwt");
const authService = require("../services/authService");

async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Session expired or invalid. Please sign in again." } });
  }

  let revoked;
  try {
    revoked = await authService.isTokenRevoked(payload.jti);
  } catch (err) {
    // Fail closed: if revocation cannot be checked, the session is not trusted.
    console.error("Session revocation check failed:", err);
    return res.status(500).json({ error: { code: "SESSION_CHECK_FAILED", message: "Could not verify session." } });
  }

  if (revoked) {
    return res.status(401).json({ error: { code: "TOKEN_REVOKED", message: "This session has been logged out. Please sign in again." } });
  }

  req.user = { id: payload.sub, email: payload.email };
  req.auth = { token, payload };
  return next();
}

module.exports = authenticate;
