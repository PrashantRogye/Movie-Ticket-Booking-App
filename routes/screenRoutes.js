
const express = require("express");
const router = express.Router();

const {
    createScreen,
    getScreensByTheatre,
    getScreenById,
    updateScreen,
    deleteScreen
} = require("../controllers/screenController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public routes
router.get(
    "/theatre/:theatreId",
    getScreensByTheatre
);

router.get(
    "/:id",
    getScreenById
);

// Super Admin routes
router.post(
    "/theatre/:theatreId",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    createScreen
);

router.patch(
    "/:id",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    updateScreen
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    deleteScreen
);

module.exports = router;
