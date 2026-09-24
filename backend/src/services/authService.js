const supabase = require("../config/supabase");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

const UNIQUE_VIOLATION = "23505";

// PostgREST answers with PGRST205 when a table is absent from its cached
// schema, Postgres with 42P01 when the relation really does not exist.
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

const REVOCATION_STORE_HINT =
  "revoked_tokens is not reachable through the Supabase data API. " +
  "Run backend/database/migrations/001_revoked_tokens.sql in the SQL editor of " +
  "the project SUPABASE_URL points at. Creating the table is not enough on its " +
  "own: the data API serves a cached schema, so the migration ends with " +
  "NOTIFY pgrst, 'reload schema'.";

class AuthError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function assertAuthConfigured() {
  if (!process.env.JWT_SECRET) {
    throw new AuthError(500, "SERVER_MISCONFIGURED", "Server authentication is not configured.");
  }
}

async function register({ name, birthDate, birthTime, birthPlace, email, password }) {
  assertAuthConfigured();

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    throw new AuthError(500, "DB_ERROR", "Could not check existing accounts.");
  }
  if (existingUser) {
    throw new AuthError(409, "EMAIL_TAKEN", "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  const { data: user, error: insertError } = await supabase
    .from("users")
    .insert({ name: String(name).trim(), email: normalizedEmail, password_hash: passwordHash })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === UNIQUE_VIOLATION) {
      throw new AuthError(409, "EMAIL_TAKEN", "An account with this email already exists.");
    }
    throw new AuthError(500, "DB_ERROR", "Could not create account.");
  }

  const { error: profileError } = await supabase.from("astrology_profile").insert({
    user_id: user.id,
    birth_date: birthDate,
    birth_time: birthTime || null,
    birth_city: birthPlace || null,
  });

  if (profileError) {
    // Roll back the user row so we don't leave an account without its required birth profile.
    await supabase.from("users").delete().eq("id", user.id);
    throw new AuthError(500, "DB_ERROR", "Could not save birth details.");
  }

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: toPublicUser(user) };
}

async function login({ email, password }) {
  assertAuthConfigured();

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, password_hash")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new AuthError(500, "DB_ERROR", "Could not verify credentials.");
  }
  if (!user) {
    throw new AuthError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const passwordMatches = await comparePassword(password, user.password_hash);
  if (!passwordMatches) {
    throw new AuthError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: toPublicUser(user) };
}

async function getUserById(id) {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new AuthError(500, "DB_ERROR", "Could not load user.");
  }
  if (!user) {
    throw new AuthError(404, "USER_NOT_FOUND", "User not found.");
  }

  return user;
}

async function revokeToken(payload) {
  if (!payload || !payload.jti || !payload.exp || !payload.sub) {
    throw new AuthError(400, "INVALID_TOKEN", "Token cannot be revoked.");
  }

  const { error } = await supabase.from("revoked_tokens").insert({
    jti: payload.jti,
    user_id: payload.sub,
    expires_at: new Date(payload.exp * 1000).toISOString(),
  });

  // A duplicate jti means the token is already revoked, which is the goal.
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("SUPABASE TOKEN REVOCATION ERROR:", error);
    throw new AuthError(500, "DB_ERROR", "Could not log out.");
  }
}

async function isTokenRevoked(jti) {
  if (!jti) {
    // Tokens issued before revocation existed carry no `jti`, so they cannot be
    // checked against the revocation list. Refuse them rather than trust them.
    return true;
  }

  const { data, error } = await supabase
    .from("revoked_tokens")
    .select("id")
    .eq("jti", jti)
    // A duplicate row would otherwise turn the single-row read into an error
    // and lock the token's owner out of every protected route.
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("SUPABASE REVOKED TOKEN ERROR:", error);
    if (MISSING_TABLE_CODES.has(error.code)) console.error(REVOCATION_STORE_HINT);
    // Fail closed: an unverifiable session is not a valid session.
    throw new AuthError(500, "DB_ERROR", "Could not verify session.");
  }

  return Boolean(data);
}

// Called once at startup so a missing revocation table is reported there
// instead of surfacing later as a 500 on every authenticated request.
async function verifyRevocationStore() {
  const { error } = await supabase.from("revoked_tokens").select("id").limit(1);

  if (!error) return true;

  if (MISSING_TABLE_CODES.has(error.code)) {
    console.error(
      "[auth] Authenticated requests will fail until this is fixed.\n" +
        `[auth] ${REVOCATION_STORE_HINT}\n` +
        `[auth] Supabase said: ${error.message}`
    );
  } else {
    console.error("[auth] revoked_tokens check failed:", error);
  }
  return false;
}

module.exports = {
  register,
  login,
  getUserById,
  revokeToken,
  isTokenRevoked,
  verifyRevocationStore,
  AuthError,
};
