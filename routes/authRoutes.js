const express = require("express");

const router = express.Router();

// Import controllers
const {
    register,
    login,
    getProfile
} = require("../controllers/authController");

// Import middleware
const { protect } = require("../middleware/authMiddleware");


// PUBLIC ROUTES

// Register
router.post("/register", register);

// Login
router.post("/login", login);


// PROTECTED ROUTES

// Get logged-in user profile
router.get("/profile", protect, getProfile);


module.exports = router;