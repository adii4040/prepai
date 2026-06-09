import { asyncHandler } from "../utils/AsyncHandler.utils.js"
import { ApiResponse } from "../utils/ApiResponse.utils.js"
import mongoose from 'mongoose'

export const healthCheck = asyncHandler(async (req, res) => {
    try {
        // 1. Ensure mongoose is connected
        if (mongoose.connection.readyState === 1) {
            // 2. Run a lightweight ping directly to the MongoDB cluster
            await mongoose.connection.db.admin().ping();

            console.log(`[${new Date().toISOString()}] Ping Received: Server & MongoDB are active.`);

            return res.status(200).json({ status: "healthy", message: "Keep-alive successful!" });
        } else {
            throw new Error("Mongoose disconnected");
        }
    } catch (error) {
        console.error("Keep-alive failed:", error.message);
        return res.status(500).json({ status: "unhealthy", error: error.message });
    }
})

