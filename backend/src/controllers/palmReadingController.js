const palmReadingService = require("../services/palmReadingService");

function sendPalmReadingError(res, err) {
  if (err instanceof palmReadingService.PalmReadingError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong." } });
}

async function create(req, res) {
  try {
    const { imageUrl, handType } = req.body;
    const reading = await palmReadingService.createPalmReading(req.user.id, { imageUrl, handType });
    res.status(201).json({ reading });
  } catch (err) {
    sendPalmReadingError(res, err);
  }
}

async function list(req, res) {
  try {
    const readings = await palmReadingService.listPalmReadings(req.user.id);
    res.status(200).json({ readings });
  } catch (err) {
    sendPalmReadingError(res, err);
  }
}

async function getOne(req, res) {
  try {
    const reading = await palmReadingService.getPalmReading(req.user.id, req.params.id);
    res.status(200).json({ reading });
  } catch (err) {
    sendPalmReadingError(res, err);
  }
}

module.exports = { create, list, getOne };
