import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log("Attempting to connect to MongoDB URI:", process.env.MONGODB_URI ? "Found URI (HIDDEN)" : "NO URI FOUND");

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ YES! The project is successfully connected to MongoDB Compass/Atlas!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ NO! Connection failed:", err.message);
        process.exit(1);
    });
