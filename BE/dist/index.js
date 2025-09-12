import express from "express";
import redisClient from "./config/redisClient.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_DB_URL || "";
const app = express();
app.use(express.json());
// app.use("/api", cacheRoutes);
const connectDB_and_cache = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");
        // await redisClient.connect();
        // console.log("Connected to Redis");
    }
    catch (error) {
        console.error(error);
    }
};
app.listen(PORT, () => {
    connectDB_and_cache();
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map