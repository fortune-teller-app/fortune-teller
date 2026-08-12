const authService = require("../services/authService");

function handleAuthError(res, err) {
  if (err instanceof authService.AuthError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong." } });
}

async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleAuthError(res, err);
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    handleAuthError(res, err);
  }
}

async function me(req, res) {
  try {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json({ user });
  } catch (err) {
    handleAuthError(res, err);
  }
}

module.exports = { register, login, me };
