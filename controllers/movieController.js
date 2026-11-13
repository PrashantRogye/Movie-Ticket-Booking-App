const Movie = require("../models/Movie");

// Allowed movie fields
const allowedStatuses = [
    "COMING_SOON",
    "NOW_SHOWING",
    "ENDED"
];

const allowedCertifications = [
    "U",
    "UA 7+",
    "UA 13+",
    "UA 16+",
    "A"
];

const isValidUrl = (value) => {
    if (value === null) return true;

    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};


// CREATE MOVIE
exports.createMovie = async (req, res) => {
    try {
        const {
            title,
            description,
            director,
            cast,
            genre,
            language,
            duration,
            releaseDate,
            certification,
            posterUrl,
            trailerUrl,
            status
        } = req.body;

        // Required field validation
        if (
            !title ||
            !description ||
            !director ||
            !genre ||
            !language ||
            !duration ||
            !releaseDate ||
            !certification
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required movie details"
            });
        }

        // Validate arrays
        if (
            !Array.isArray(genre) ||
            genre.length === 0 ||
            !genre.every(item => typeof item === "string" && item.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Genre must be a non-empty array of strings"
            });
        }

        if (
            !Array.isArray(language) ||
            language.length === 0 ||
            !language.every(item => typeof item === "string" && item.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Language must be a non-empty array of strings"
            });
        }

        if (
            cast !== undefined &&
            (!Array.isArray(cast) ||
                !cast.every(item => typeof item === "string"))
        ) {
            return res.status(400).json({
                success: false,
                message: "Cast must be an array of strings"
            });
        }

        // Validate duration
        if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Duration must be a positive number"
            });
        }

        // Validate date
        if (
            typeof releaseDate !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate) ||
            Number.isNaN(Date.parse(releaseDate)) ||
            new Date(releaseDate).toISOString().slice(0, 10) !== releaseDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Release date must be a valid YYYY-MM-DD date"
            });
        }

        // Validate certification
        if (!allowedCertifications.includes(certification)) {
            return res.status(400).json({
                success: false,
                message: "Invalid movie certification"
            });
        }

        // Validate status
        const movieStatus = status || "COMING_SOON";

        if (!allowedStatuses.includes(movieStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid movie status"
            });
        }

        // Validate URLs
        if (
            !isValidUrl(posterUrl) ||
            !isValidUrl(trailerUrl)
        ) {
            return res.status(400).json({
                success: false,
                message: "Poster and trailer must be valid HTTP or HTTPS URLs"
            });
        }

        // Create movie
        const movie = await Movie.create({
            title,
            description,
            director,
            cast: cast || [],
            genre: genre.map(item => item.trim()),
            language: language.map(item => item.trim()),
            duration: Number(duration),
            releaseDate,
            certification,
            posterUrl,
            trailerUrl,
            status: movieStatus,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Movie created successfully",
            movie
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to create movie",
            error: error.message
        });
    }
};


// GET ALL ACTIVE MOVIES
exports.getAllMovies = async (req, res) => {
    try {
        const {
            search,
            genre,
            language,
            status,
            sort = "newest",
            page = 1,
            limit = 10
        } = req.query;

        const filter = {
            isActive: true
        };

        // Search by title
        if (search) {
            if (typeof search !== "string" || search.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid search value"
                });
            }

            const safeSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.title = {
                $regex: safeSearch,
                $options: "i"
            };
        }

        // Filter by genre
        if (genre) {
            filter.genre = {
                $in: genre.split(",").map(item => item.trim())
            };
        }

        // Filter by language
        if (language) {
            filter.language = {
                $in: language.split(",").map(item => item.trim())
            };
        }

        // Filter by status
        if (status) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid movie status"
                });
            }

            filter.status = status;
        }

        // Sorting
        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            title: { title: 1 },
            releaseDate: { releaseDate: 1 }
        };

        if (!sortOptions[sort]) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort option"
            });
        }

        // Pagination
        const currentPage = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const perPage = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 10)
        );

        const skip = (currentPage - 1) * perPage;

        const [movies, totalMovies] = await Promise.all([
            Movie.find(filter)
                .sort(sortOptions[sort])
                .skip(skip)
                .limit(perPage),

            Movie.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            message: "Movies fetched successfully",

            pagination: {
                totalMovies,
                currentPage,
                totalPages: Math.ceil(totalMovies / perPage),
                limit: perPage
            },

            movies
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to fetch movies",
            error: error.message
        });
    }
};


// GET MOVIE BY ID
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findOne({
            _id: req.params.id,
            isActive: true
        });

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Movie not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Movie details fetched successfully",
            movie
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid movie ID"
        });
    }
};


// GET ALL MOVIES FOR ADMIN
exports.getAdminMovies = async (req, res) => {
    try {
        const movies = await Movie.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalMovies: movies.length,
            movies
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to fetch admin movies",
            error: error.message
        });
    }
};


// UPDATE MOVIE
exports.updateMovie = async (req, res) => {
    try {
        const allowedFields = [
            "title",
            "description",
            "director",
            "cast",
            "genre",
            "language",
            "duration",
            "releaseDate",
            "certification",
            "posterUrl",
            "trailerUrl",
            "status"
        ];

        const updateData = {};

        // Only allow approved fields
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided"
            });
        }

        // Validate arrays
        for (const field of ["genre", "language", "cast"]) {
            if (updateData[field] !== undefined) {
                if (
                    !Array.isArray(updateData[field]) ||
                    (field !== "cast" && updateData[field].length === 0) ||
                    !updateData[field].every(
                        item => typeof item === "string" &&
                            (field === "cast" || item.trim())
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} must be a valid array of strings`
                    });
                }

                updateData[field] = updateData[field].map(
                    item => item.trim()
                );
            }
        }

        if (updateData.duration !== undefined) {
            if (
                !Number.isFinite(Number(updateData.duration)) ||
                Number(updateData.duration) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Duration must be a positive number"
                });
            }

            updateData.duration = Number(updateData.duration);
        }

        if (
            updateData.releaseDate !== undefined &&
            (
                typeof updateData.releaseDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(updateData.releaseDate) ||
                Number.isNaN(Date.parse(updateData.releaseDate)) ||
                new Date(updateData.releaseDate).toISOString().slice(0, 10)
                !== updateData.releaseDate
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Release date must be a valid YYYY-MM-DD date"
            });
        }

        if (
            updateData.certification !== undefined &&
            !allowedCertifications.includes(updateData.certification)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid movie certification"
            });
        }

        if (
            updateData.status !== undefined &&
            !allowedStatuses.includes(updateData.status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid movie status"
            });
        }

        for (const field of ["posterUrl", "trailerUrl"]) {
            if (
                updateData[field] !== undefined &&
                !isValidUrl(updateData[field])
            ) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a valid HTTP or HTTPS URL`
                });
            }
        }

        const movie = await Movie.findOneAndUpdate(
            {
                _id: req.params.id,
                isActive: true
            },
            {
                $set: updateData
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Active movie not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Movie updated successfully",
            movie
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Unable to update movie",
            error: error.message
        });
    }
};


// DELETE MOVIE (SOFT DELETE)
exports.deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findOneAndUpdate(
            {
                _id: req.params.id,
                isActive: true
            },
            {
                $set: {
                    isActive: false
                }
            },
            {
                new: true
            }
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Active movie not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Movie deactivated successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid movie ID",
            error: error.message
        });
    }
};