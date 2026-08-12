const profileService = require("../services/profileService");
const statsService = require("../services/statsService");

function sendProfileError(res, err) {
  if (err instanceof profileService.ProfileError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong." } });
}

async function loadFullProfile(userId) {
  const [profile, subscription] = await Promise.all([
    profileService.getProfileByUserId(userId),
    profileService.getSubscriptionByUserId(userId),
  ]);
  return { ...profile, subscription };
}

async function me(req, res) {
  try {
    const profile = await loadFullProfile(req.user.id);
    res.status(200).json({ profile });
  } catch (err) {
    sendProfileError(res, err);
  }
}

async function update(req, res) {
  try {
    await profileService.updateProfile(req.user.id, req.body);
    const profile = await loadFullProfile(req.user.id);
    res.status(200).json({ profile });
  } catch (err) {
    sendProfileError(res, err);
  }
}

async function stats(req, res) {
  try {
    const stats = await statsService.getReadingStatsByUserId(req.user.id);
    res.status(200).json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Could not load reading statistics." } });
  }
}

module.exports = { me, update, stats };
