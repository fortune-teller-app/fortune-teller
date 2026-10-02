const express = require("express");
const { create, list, getOne } = require("../controllers/palmReadingController");
const authenticate = require("../middleware/authenticate");
const { validateCreatePalmReading, validatePalmReadingId } = require("../middleware/validatePalmReading");

const router = express.Router();

router.post("/readings", authenticate, validateCreatePalmReading, create);
router.get("/readings", authenticate, list);
router.get("/readings/:id", authenticate, validatePalmReadingId, getOne);

module.exports = router;
