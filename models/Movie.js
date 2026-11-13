const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        director: {
            type: String,
            required: true,
            trim: true
        },

        cast: {
            type: [String],
            default: []
        },

        genre: {
            type: [String],
            required: true
        },

        /* language: {
            type: [String],
            default: [],
            required: true
        }, */

        duration: {
            type: Number,
            required: true,
            min: 1
        },

        releaseDate: {
            type: Date,
            required: true
        },

        certification: {
            type: String,
            enum: ["U", "UA 7+", "UA 13+", "UA 16+", "A"],
            required: true
        },

        posterUrl: {
            type: String,
            default: null
        },

        trailerUrl: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "COMING_SOON",
                "NOW_SHOWING",
                "ENDED"
            ],
            default: "COMING_SOON"
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

// Indexes for common search and filtering operations
movieSchema.index({ title: "text" });
movieSchema.index({ status: 1, isActive: 1 });
movieSchema.index({ genre: 1, language: 1 });

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;