
const Theatre = require("../models/Theatre");
const User = require("../models/User");
const Screen = require("../models/Screen");

// 1. Create Theatre
exports.createTheatre = async (req, res) => {
    try {
        const {
            name,
            description,
            address,
            city,
            state,
            pincode,
            phone,
            email
        } = req.body;

        if (
            !name ||
            !address ||
            !city ||
            !state ||
            !pincode ||
            !phone
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required theatre details"
            });
        }

        const theatre = await Theatre.create({
            name,
            description,
            address,
            city,
            state,
            pincode,
            phone,
            email,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Theatre created successfully",
            data: theatre
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 2. Get All Theatres
exports.getAllTheatres = async (req, res) => {
    try {
        const {
            city,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {
            isActive: true
        };

        if (city) {
            filter.city = new RegExp(
                city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );
        }

        if (search) {
            const safeSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.name = new RegExp(safeSearch, "i");
        }

        const pageNumber = Math.max(1, Number(page));
        const limitNumber = Math.min(
            100,
            Math.max(1, Number(limit))
        );

        const theatres = await Theatre.find(filter)
            .populate("manager", "name email phone")
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        const total = await Theatre.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: theatres,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 3. Get Theatre By ID
exports.getTheatreById = async (req, res) => {
    try {
        const theatre = await Theatre.findOne({
            _id: req.params.id,
            isActive: true
        }).populate("manager", "name email phone");

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found"
            });
        }

        const screens = await Screen.find({
            theatre: theatre._id,
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: {
                theatre,
                screens
            }
        });

    } catch (error) {
        const isInvalidId = error.name === "CastError";

        res.status(isInvalidId ? 400 : 500).json({
            success: false,
            message: isInvalidId
                ? "Invalid theatre ID"
                : error.message
        });
    }
};

// 4. Update Theatre
exports.updateTheatre = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "description",
            "address",
            "city",
            "state",
            "pincode",
            "phone",
            "email"
        ];

        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const theatre = await Theatre.findOneAndUpdate(
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

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Theatre updated successfully",
            data: theatre
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

// 5. Assign Theatre Manager
exports.assignTheatreManager = async (req, res) => {
    try {
        const { managerId } = req.body;

        if (!managerId) {
            return res.status(400).json({
                success: false,
                message: "Manager ID is required"
            });
        }

        const manager = await User.findOne({
            _id: managerId,
            role: "THEATRE_MANAGER",
            isActive: true
        });

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: "Active Theatre Manager not found"
            });
        }

        const theatre = await Theatre.findOneAndUpdate(
            {
                _id: req.params.id,
                isActive: true
            },
            {
                manager: manager._id
            },
            {
                new: true
            }
        ).populate("manager", "name email phone");

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Theatre Manager assigned successfully",
            data: theatre
        });

    } catch (error) {
        res.status(error.name === "CastError" ? 400 : 500).json({
            success: false,
            message: error.name === "CastError"
                ? "Invalid ID"
                : error.message
        });
    }
};

// 6. Deactivate Theatre
exports.deleteTheatre = async (req, res) => {
    try {
        const theatre = await Theatre.findOneAndUpdate(
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

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Theatre deactivated successfully"
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
