
const Screen = require("../models/Screen");
const Theatre = require("../models/Theatre");

// 1. Create Screen
exports.createScreen = async (req, res) => {
    try {
        const {
            name,
            screenType,
            rows,
            seats
        } = req.body;

        const theatre = await Theatre.findOne({
            _id: req.params.theatreId,
            isActive: true
        });

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Active theatre not found"
            });
        }

        if (!name || !Array.isArray(seats) || !seats.length) {
            return res.status(400).json({
                success: false,
                message: "Screen name and seats are required"
            });
        }

        const validTypes = [
            "2D", "3D", "IMAX", "4DX", "DOLBY"
        ];

        if (screenType && !validTypes.includes(screenType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid screen type"
            });
        }

        const seatNumbers = seats.map(
            (seat) => seat.seatNumber
        );

        if (
            seatNumbers.some((number) => !number) ||
            new Set(seatNumbers).size !== seatNumbers.length
        ) {
            return res.status(400).json({
                success: false,
                message: "Seat numbers must be provided and unique"
            });
        }

        const validCategories = [
            "REGULAR", "PREMIUM", "RECLINER"
        ];

        for (const seat of seats) {
            if (
                !seat.row ||
                !validCategories.includes(
                    seat.category || "REGULAR"
                ) ||
                !Number.isFinite(Number(seat.price)) ||
                Number(seat.price) < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid seat details"
                });
            }
        }

        const screen = await Screen.create({
            theatre: theatre._id,
            name,
            screenType: screenType || "2D",
            rows: rows || new Set(
                seats.map((seat) => seat.row)
            ).size,
            totalSeats: seats.length,
            seats,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Screen created successfully",
            data: screen
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A screen with this name already exists in this theatre"
            });
        }

        res.status(error.name === "CastError" ? 400 : 500).json({
            success: false,
            message: error.name === "CastError"
                ? "Invalid theatre ID"
                : error.message
        });
    }
};

// 2. Get Screens By Theatre
exports.getScreensByTheatre = async (req, res) => {
    try {
        const screens = await Screen.find({
            theatre: req.params.theatreId,
            isActive: true
        }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: screens.length,
            data: screens
        });

    } catch (error) {
        res.status(error.name === "CastError" ? 400 : 500).json({
            success: false,
            message: error.name === "CastError"
                ? "Invalid theatre ID"
                : error.message
        });
    }
};

// 3. Get Screen By ID
exports.getScreenById = async (req, res) => {
    try {
        const screen = await Screen.findOne({
            _id: req.params.id,
            isActive: true
        }).populate("theatre", "name city");

        if (!screen) {
            return res.status(404).json({
                success: false,
                message: "Screen not found"
            });
        }

        res.status(200).json({
            success: true,
            data: screen
        });

    } catch (error) {
        res.status(error.name === "CastError" ? 400 : 500).json({
            success: false,
            message: error.name === "CastError"
                ? "Invalid screen ID"
                : error.message
        });
    }
};

// 4. Update Screen
exports.updateScreen = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "screenType",
            "rows"
        ];

        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const screen = await Screen.findOneAndUpdate(
            {
                _id: req.params.id,
                isActive: true
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!screen) {
            return res.status(404).json({
                success: false,
                message: "Screen not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Screen updated successfully",
            data: screen
        });

    } catch (error) {
        res.status(error.name === "CastError" ? 400 : 500).json({
            success: false,
            message: error.name === "CastError"
                ? "Invalid screen ID"
                : error.message
        });
    }
};

// 5. Deactivate Screen
exports.deleteScreen = async (req, res) => {
    try {
        const screen = await Screen.findOneAndUpdate(
            {
                _id: req.params.id,
                isActive: true
            },
            {
                isActive: false
            },
            {
                new: true
            }
        );

        if (!screen) {
            return res.status(404).json({
                success: false,
                message: "Screen not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Screen deactivated successfully"
        });

    } catch (error) {
        res.status(error.name === "CastError" ? 400 : 500).json({
            success: false,
            message: error.name === "CastError"
                ? "Invalid screen ID"
                : error.message
        });
    }
};
