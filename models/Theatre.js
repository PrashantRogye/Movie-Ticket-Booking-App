
const mongoose = require("mongoose");

const theatreSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        pincode: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
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

// Indexes
theatreSchema.index({ city: 1, isActive: 1 });
theatreSchema.index({ manager: 1 });

module.exports = mongoose.model("Theatre", theatreSchema);
