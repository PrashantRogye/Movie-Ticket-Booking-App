const User = require("../models/User");

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
    try {
        const {
            role,
            isActive,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        // Filter by role
        if (role) {
            const allowedRoles = [
                "SUPER_ADMIN",
                "THEATRE_MANAGER",
                "CUSTOMER"
            ];

            if (!allowedRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role"
                });
            }

            filter.role = role;
        }

        // Filter by account status
        if (isActive !== undefined) {
            if (!["true", "false"].includes(isActive)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid isActive value"
                });
            }

            filter.isActive = isActive === "true";
        }

        // Search by name or email
        if (search) {
            const safeSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { email: { $regex: safeSearch, $options: "i" } }
            ];
        }

        // Pagination validation
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const perPage = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 10)
        );

        const skip = (currentPage - 1) * perPage;

        const [users, totalUsers] = await Promise.all([
            User.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage),

            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            message: "Users fetched successfully",

            pagination: {
                totalUsers,
                currentPage,
                totalPages: Math.ceil(totalUsers / perPage),
                limit: perPage
            },

            users
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to fetch users",
            error: error.message
        });
    }
};


// GET SINGLE USER
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }
};


// UPDATE USER DETAILS
exports.updateUser = async (req, res) => {
    try {
        const { name, phone, profileImage } = req.body;

        const updateData = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }

            updateData.name = name.trim();
        }

        if (phone !== undefined) {
            updateData.phone = phone;
        }

        if (profileImage !== undefined) {
            updateData.profileImage = profileImage;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Unable to update user",
            error: error.message
        });
    }
};


// UPDATE USER ROLE
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        const allowedRoles = [
            "SUPER_ADMIN",
            "THEATRE_MANAGER",
            "CUSTOMER"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent self role changes
        if (user._id.equals(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role"
            });
        }

        // Protect the last active Super Admin
        if (
            user.role === "SUPER_ADMIN" &&
            user.isActive &&
            role !== "SUPER_ADMIN"
        ) {
            const adminCount = await User.countDocuments({
                role: "SUPER_ADMIN",
                isActive: true
            });

            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "At least one active Super Admin is required"
                });
            }
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to update user role",
            error: error.message
        });
    }
};


// ACTIVATE / DEACTIVATE USER
exports.updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent self-deactivation
        if (
            user._id.equals(req.user.id) &&
            !isActive
        ) {
            return res.status(400).json({
                success: false,
                message: "You cannot deactivate your own account"
            });
        }

        // Protect the last active Super Admin
        if (
            user.role === "SUPER_ADMIN" &&
            user.isActive &&
            !isActive
        ) {
            const adminCount = await User.countDocuments({
                role: "SUPER_ADMIN",
                isActive: true
            });

            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "At least one active Super Admin is required"
                });
            }
        }

        user.isActive = isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: isActive
                ? "User activated successfully"
                : "User deactivated successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to update user status",
            error: error.message
        });
    }
};