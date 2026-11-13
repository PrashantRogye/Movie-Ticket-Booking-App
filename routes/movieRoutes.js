const express = require("express");

const router = express.Router();

// Import controllers
const {
    createMovie,
    getAllMovies,
    getMovieById,
    getAdminMovies,
    updateMovie,
    deleteMovie
} = require("../controllers/movieController");

// Import middleware
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");


// PUBLIC ROUTES

// Get all active movies
router.get("/", getAllMovies);

// Get movie details
router.get("/:id", getMovieById);


// SUPER ADMIN ROUTES

// Get all movies including inactive movies
router.get(
    "/admin/all",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    getAdminMovies
);

// Create movie
router.post(
    "/",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    createMovie
);

// Update movie
router.patch(
    "/:id",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    updateMovie
);

// Delete movie
router.delete(
    "/:id",
    protect,
    authorizeRoles("SUPER_ADMIN"),
    deleteMovie
);


module.exports = router;