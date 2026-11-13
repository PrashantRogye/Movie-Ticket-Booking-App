const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const movieRoutes = require("./routes/movieRoutes");
const theatreRoutes = require("./routes/theatreRoutes");
const screenRoutes = require("./routes/screenRoutes");

const app = express();


// Middleware
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// Default route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Movie Ticket Booking API is running"
    });
});


// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/screens", screenRoutes);


// Start server after database connection
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();