const express = require("express");

const router = express.Router();

// Import controllers
const {
    getAllUsers,
    getUserById,
    updateUser,
    updateUserRole,
    updateUserStatus
} = require("../controllers/userController");

// Import middleware
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");


// All routes require Super Admin authentication
router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));


// GET ALL USERS
router.get("/", getAllUsers);


// GET SINGLE USER
router.get("/:id", getUserById);


// UPDATE USER DETAILS
router.patch("/:id", updateUser);


// UPDATE USER ROLE
router.patch("/:id/role", updateUserRole);


// ACTIVATE / DEACTIVATE USER
router.patch("/:id/status", updateUserStatus);


module.exports = router;