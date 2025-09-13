import { Router } from "express";
import { User } from "../../Db/schema.js";
import { ethers } from "ethers";
import { PoolABI } from "../../contracts/abi.js";
import { Payout } from "../../Db/schema.js";

const poolAddress = process.env.Contract_Address || "";
const provider = new ethers.JsonRpcProvider(process.env.MONAD_TESTNET_RPC || "");
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const poolContract = new ethers.Contract(poolAddress, PoolABI, signer) as any;

const WithdrawFundsRouter = Router();


const withdrawFunds = async (req: any, res: any) => {
    const {walletAddress, amount} = req.body;
    
    // Input validation
    if (!walletAddress || !amount || amount <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid input: walletAddress and positive amount required" 
        });
    }
    
    try {
        // Find user
        const user = await User.findOne({walletAddress});
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Check if user has sufficient balance
        if (user.DepositBalance < amount) {
            return res.status(400).json({ 
                success: false, 
                message: "Insufficient balance" 
            });
        }
        
        // Check contract balance before attempting withdrawal
        const contractBalance = await poolContract.getBalance();
        const amountInWei = ethers.parseEther(amount.toString());
        
        if (contractBalance < amountInWei) {
            return res.status(400).json({ 
                success: false, 
                message: "Contract has insufficient funds" 
            });
        }
        
        // Execute withdrawal transaction (updated function signature)
        const withdrawTx = await poolContract.userWithdraw(amountInWei);
        const receipt = await withdrawTx.wait();
        
        if (receipt.status === 1) { // Transaction successful
            // Update user data in a single operation
            const updatedUser = await User.findOneAndUpdate(
                { walletAddress },
                {
                    $inc: {
                        DepositBalance: -amount,
                        balance: amount,
                        totalEarned: amount,
                        roundsPlayed: 1
                    },
                    $set: {
                        payouts: 0
                    }
                },
                { new: true }
            );
            if(updatedUser == null) return res.status(400).json({ success: false, message: "User not found" });
            await Payout.create({user: updatedUser._id, amount, txHash: receipt.transactionHash});

            
            res.status(200).json({ 
                success: true, 
                message: "Funds withdrawn successfully", 
                user: updatedUser,
                transactionHash: receipt.transactionHash
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: "Withdrawal transaction failed" 
            });
        }
    } catch (error: any) {
        console.error("Withdrawal error:", error);
        
        // Handle specific contract errors
        if (error.message?.includes("Insufficient balance")) {
            return res.status(400).json({ 
                success: false, 
                message: "Insufficient balance in contract" 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}


WithdrawFundsRouter.post("/withdrawFunds", withdrawFunds);


export default WithdrawFundsRouter;