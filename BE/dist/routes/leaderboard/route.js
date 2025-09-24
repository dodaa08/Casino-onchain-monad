import { Router } from "express";
import { User } from "../../Db/schema.js";
const LeaderboardRouter = Router();
LeaderboardRouter.get("/leaderboard-data", async (req, res) => {
    try {
        // Get top 100 users with highest earnings, excluding users with 0 earnings
        const users = await User.find({ totalEarned: { $gt: 0 } })
            .sort({ totalEarned: -1 }) // Sort by totalEarned descending
            .limit(100) // Limit to top 100
            .select('walletAddress totalEarned roundsPlayed'); // Only return needed fields
        const leaderboardData = users.map((user, index) => ({
            rank: index + 1,
            walletAddress: user.walletAddress,
            totalEarned: user.totalEarned,
            roundsPlayed: user.roundsPlayed || 0
        }));
        res.status(200).json({
            success: true,
            data: {
                leaderboard: leaderboardData,
                totalPlayers: leaderboardData.length
            }
        });
    }
    catch (error) {
        console.error("Leaderboard error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
export default LeaderboardRouter;
//# sourceMappingURL=route.js.map