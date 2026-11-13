
const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
    {
        seatNumber: {
            type: String,
            required: true,
            trim: true
        },

        row: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        category: {
            type: String,
            enum: ["REGULAR", "PREMIUM", "RECLINER"],
            default: "REGULAR"
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        _id: true
    }
);

const screenSchema = new mongoose.Schema(
    {
        theatre: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Theatre",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        screenType: {
            type: String,
            enum: ["2D", "3D", "IMAX", "4DX", "DOLBY"],
            default: "2D"
        },

        totalSeats: {
            type: Number,
            default: 0,
            min: 0
        },

        rows: {
            type: Number,
            default: 0,
            min: 0
        },

        seats: {
            type: [seatSchema],
            default: []
        },

        isActive: {
            type: Boolean,
            default: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate screen names within the same theatre.
screenSchema.index(
    { theatre: 1, name: 1 },
    { unique: true }
);

screenSchema.index({ theatre: 1, isActive: 1 });

module.exports = mongoose.model("Screen", screenSchema);
