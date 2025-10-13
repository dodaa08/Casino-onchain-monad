import express from "express";
const CacheRouter = express.Router();
import redisClient from "../../config/redisClient.js";
import { User } from "../../Db/schema.js";

// Cache tile interactions
const CacheTilesRowsClicked = async (req : any, res : any)=>{
    const { sessionId, rowIndex, tileIndex, isDeath, roundEnded, walletAddress } = req.body;
    try{
        if(!sessionId || rowIndex == undefined){
            return res.status(400).json({success: false, message: "Session ID and row index are required"});
        } 
        
        if (tileIndex === undefined || tileIndex === null){
            return res.status(400).json({success: false, message: "Tile index is required"});
        }

        if(!sessionId || rowIndex == undefined){
            return res.status(400).json({success: false, message: "Session ID and row index are required"});
        }

        if (!walletAddress){
            return res.status(400).json({success: false, message: "Wallet address is required"});
        }

        if(roundEnded && !isDeath){
            await redisClient.del(`game:${sessionId}`);
            await redisClient.del(`game:${sessionId}:roundEnded`);
            await redisClient.del(`game:${walletAddress.toLowerCase()}:sessionId`);
            return res.status(200).json({
                success: true,
                message: `Round ended, cache cleared for session ${sessionId}`,
            });
        }

        const rowkey =  `game:${sessionId}:row:${rowIndex}`;
        if(isDeath){
            await redisClient.set(`${rowkey}:death`, tileIndex);
            await redisClient.set(`game:${sessionId}:roundEnded`, "true");
            await redisClient.set(`game:${sessionId}:isPlaying`, "false");
            await redisClient.del(`game:${walletAddress.toLowerCase()}:sessionId`);

            const user = await User.findOne({walletAddress});
            if (user) {
                const currentBalance = user.DepositBalance || 0;
                await User.updateOne({walletAddress}, {
                    $set: {
                        DepositBalance: 0,
                    },
                    $inc: {
                        roundsPlayed: 1
                    }
                });

                console.log(`[DEATH] User ${walletAddress} died. Balance reset from ${currentBalance} to 0`);
            }

            return res.status(200).json({
                success: true,
                message: `Death tile hit! Round ended`,
                rowIndex,
                death: tileIndex,
                roundEnded: true
            });
        }
        else{
            const roundEnded = await redisClient.get(`game:${sessionId}:roundEnded`);
            if (!roundEnded) {
                await redisClient.set(`${rowkey}:clicked`, tileIndex);
            }
            
            await redisClient.set(`game:${sessionId}:isPlaying`, "true");
            await redisClient.set(`game:${sessionId}:rowIndex`, String(rowIndex));
            await redisClient.set(`game:${String(walletAddress).toLowerCase()}:sessionId`, String(sessionId));
        }

        const clicked = await redisClient.get(`${rowkey}:clicked`);
        const death = await redisClient.get(`${rowkey}:death`);
        
        return res.status(200).json({
            success: true,
            message: "Tile cached successfully",
            rowIndex,
            clicked,
            death,
          });
    }
    catch(error){
        console.error(error);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}

// Cache increasing payout; on round end persist and clear
export const CachetheIncreasingPayoutAmount = async (req: any, res: any) => {
    const { key, value, roundEnded, walletAddress } = req.body;
    try {
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            return res.status(400).json({ success: false, message: "Invalid payout value" });
        }

        if (roundEnded) {
            const user = await User.findOne({ walletAddress: key });
            if (!user) {
                return res.status(400).json({ success: false, message: "User not found" });
            }

            const finalPayout = await redisClient.get(key);
            const finalPayoutNum = finalPayout ? Number(finalPayout) : 0;
            const FinalPayoutMon = finalPayoutNum / 150;
            
            if (finalPayoutNum > 0) {
                await User.updateOne({ walletAddress: key }, { 
                    $inc: { 
                        totalEarned: FinalPayoutMon,
                        payouts: FinalPayoutMon
                    }
                });

                console.log(`[WIN] User ${key} won ${FinalPayoutMon} MON (${finalPayoutNum} death points)`);
               
            } else {
                await User.updateOne({ walletAddress: key }, { 
                    $set: { 
                        payouts: 0
                    }
                });
                console.log(`[DEATH] User ${key} died - payout saved as 0`);
            }
            
            await redisClient.del(key);

            return res.status(200).json({
                success: true,
                message: `Round ended, final payout amount saved for user ${key}`,
                data: finalPayoutNum,
            });
        }

        await redisClient.set(key, numericValue.toString());
        return res.status(200).json({
            success: true,
            message: `Cache set for key ${key}`,
            data: numericValue,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};




CacheRouter.get("/check-cache/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    
    const roundEnded = await redisClient.get(`game:${sessionId}:roundEnded`);
    const isPlaying = await redisClient.get(`game:${sessionId}:isPlaying`);
    const rowIndex = await redisClient.get(`game:${sessionId}:rowIndex`);
    const session = await redisClient.get(`game:${sessionId}`);
    
    res.set("Cache-Control", "no-store");
    
    res.json({
        session,
        roundEnded: roundEnded === "true",
        isPlaying: isPlaying === "true",
        lastClickedRow: rowIndex ? Number(rowIndex) : null,
      });
});




CacheRouter.get("/check-cache/:sessionId/:rowIndex", async (req, res) => {
    const { sessionId, rowIndex } = req.params;

    console.log("[check-cache] sessionId", sessionId, "rowIndex", rowIndex);
    
    const rowkey = `game:${sessionId}:row:${rowIndex}`;
    
    const clicked = await redisClient.get(`${rowkey}:clicked`);
    const death = await redisClient.get(`${rowkey}:death`);
    
    res.json({ clicked, death });
});



CacheRouter.get("/check-payout/:key", async (req, res) => {
    const { key } = req.params;
    const payout = await redisClient.get(key);
    // const roundEnded = await redisClient.get(``);

    res.json({ payout });
});



CacheRouter.get("/get-last-sessionId/:walletAddress", async (req, res) => {
    const { walletAddress } = req.params;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "walletAddress is required" });
    }
    try {
      const key = `game:${walletAddress.toLowerCase()}:sessionId`;
      const lastSessionId = await redisClient.get(key);
      return res.status(200).json({
        success: true,
        message: "Last session id",
        walletAddress: walletAddress.toLowerCase(),
        lastSessionId: lastSessionId ?? null,
      });
    } catch (error) {
      console.error("[get-last-sessionId] error", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
});




// Clear cache for a specific wallet address
const ClearCache = async (req: any, res: any) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "Wallet address is required" });
    }
    
    console.log(`[ClearCache] Clearing cache for wallet: ${walletAddress}`);
    
    // Clear payout cache
    const payoutKey = `payout:${walletAddress}`;
    await redisClient.del(payoutKey);
    
    // Clear last session ID
    const sessionKey = `game:${walletAddress.toLowerCase()}:sessionId`;
    await redisClient.del(sessionKey);
    
    console.log(`[ClearCache] Cleared cache keys: ${payoutKey}, ${sessionKey}`);
    
    return res.status(200).json({ 
      success: true, 
      message: "Cache cleared successfully" 
    });
    
  } catch (error) {
    console.error("[ClearCache] error", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

CacheRouter.post("/cache-tiles", CacheTilesRowsClicked);
CacheRouter.post("/cache-payout", CachetheIncreasingPayoutAmount);
CacheRouter.post("/clear-cache", ClearCache);

export default CacheRouter;