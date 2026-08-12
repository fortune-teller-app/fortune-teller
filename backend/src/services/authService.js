const supabase = require("../config/supabase");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

const UNIQUE_VIOLATION = "23505";

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

module.exports = { register, login, getUserById, AuthError };
