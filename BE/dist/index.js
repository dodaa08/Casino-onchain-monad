import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_DB_URL || "";
// routes
import CacheRouter from "./routes/cache/cache.js";
import PayoutsRouter from "./routes/payouts/route.js";
import DepositFundsRouter from "./routes/depositFunds/route.js";
import UserRouter from "./routes/users/route.js";
import WithdrawFundsRouter from "./routes/withdrawFunds/route.js";
import LeaderboardRouter from "./routes/leaderboard/route.js";
const app = express();
app.use(express.json());
// app.use(cors({  
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
// }));
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use("/api/cache", CacheRouter);
app.use("/api/payouts", PayoutsRouter);
app.use("/api/depositFunds", DepositFundsRouter);
app.use("/api/users", UserRouter);
app.use("/api/withdrawFunds", WithdrawFundsRouter);
app.use("/api/leaderboard", LeaderboardRouter);
app.get("/", (req, res) => {
    res.send("Hello World");
});
app.get("/health", (req, res) => {
    res.send("OK");
});
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