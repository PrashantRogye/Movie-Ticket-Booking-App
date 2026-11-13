const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },

        phone: {
            type: String,
            trim: true
        },

        role: {
            type: String,
            enum: [
                "SUPER_ADMIN",
                "THEATRE_MANAGER",
                "CUSTOMER"
            ],
            default: "CUSTOMER"
        },

        isActive: {
            type: Boolean,
            default: true
        },

        lastLogin: {
            type: Date,
            default: null
        },

        profileImage: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;