const express = require("express");
const { register, login, logout, me } = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../middleware/validateAuth");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

module.exports = router;
