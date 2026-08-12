const express = require("express");
const { me, update, stats } = require("../controllers/profileController");
const authenticate = require("../middleware/authenticate");
const validateProfileUpdate = require("../middleware/validateProfileUpdate");

const router = express.Router();

router.get("/me", authenticate, me);
router.patch("/", authenticate, validateProfileUpdate, update);
router.get("/stats", authenticate, stats);

module.exports = router;
