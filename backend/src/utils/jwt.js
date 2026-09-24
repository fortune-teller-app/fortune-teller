const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWT_EXPIRES_IN = "7d";

function signToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  // A unique `jti` lets a single token be revoked on logout.
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
