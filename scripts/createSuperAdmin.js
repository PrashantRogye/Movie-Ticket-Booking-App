const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const { SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL,
            SUPER_ADMIN_PASSWORD } = process.env;

        if (
            !SUPER_ADMIN_NAME ||
            !SUPER_ADMIN_EMAIL ||
            !SUPER_ADMIN_PASSWORD
        ) {
            throw new Error("Super Admin environment variables are missing");
        }

        if (SUPER_ADMIN_PASSWORD.length < 12) {
            throw new Error("Super Admin password must be at least 12 characters");
        }

        const existingAdmin = await User.findOne({
            role: "SUPER_ADMIN"
        });

        if (existingAdmin) {
            throw new Error("A Super Admin already exists");
        }

        const email = SUPER_ADMIN_EMAIL.toLowerCase().trim();

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new Error("This email is already registered");
        }

        const hashedPassword = await bcrypt.hash(
            SUPER_ADMIN_PASSWORD,
            12
        );

        const admin = await User.create({
            name: SUPER_ADMIN_NAME,
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            isActive: true
        });

        console.log("Super Admin created successfully:", admin.email);

    } catch (error) {
        console.error("Error:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

createSuperAdmin();