
const express = require("express");
const router = express.Router();

const {
    createTheatre,
    getAllTheatres,
    getTheatreById,
    updateTheatre,
    assignTheatreManager,
    deleteTheatre
} = require("../controllers/theatreController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public routes
router.get("/", getAllTheatres);
router.get("/:id", getTheatreById);

// Super Admin routes
router.post(
    "/",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    createTheatre
);

router.patch(
    "/:id",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    updateTheatre
);

router.patch(
    "/:id/manager",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    assignTheatreManager
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    deleteTheatre
);

module.exports = router;
