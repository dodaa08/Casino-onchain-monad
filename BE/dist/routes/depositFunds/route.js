import { Router } from "express";
import { User } from "../../Db/schema.js";
import { ethers } from "ethers";
// import { PoolABI } from "../../contracts/abi.js";
// import { Payout } from "../../Db/schema.js";
const poolAddress = process.env.Contract_Address || "";
const provider = new ethers.JsonRpcProvider(process.env.MONAD_TESTNET_RPC || "");
// const poolContract = new ethers.Contract(poolAddress, PoolABI, provider) as any;   
const DepositFundsRouter = Router();
const depositFunds = async (req, res) => {
    const { walletAddress, amount, txHash } = req.body;
    // Input validation
    if (!walletAddress || !amount || !txHash) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: walletAddress, amount, txHash"
        });
    }
    if (amount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than 0"
        });
    }
    try {
        // Find user
        const user = await User.findOne({ walletAddress });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Verify transaction exists and is valid
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
            return res.status(400).json({ success: false, message: "Transaction not found" });
        }
        // Wait for transaction to be mined
        const receipt = await provider.waitForTransaction(txHash);
        if (!receipt || receipt.status !== 1) {
            return res.status(400).json({
                success: false,
                message: "Transaction failed or not confirmed"
            });
        }
        // Verify transaction is to the correct contract
        if (tx.to?.toLowerCase() !== poolAddress.toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: "Transaction is not to the pool contract"
            });
        }
        // Verify the transaction is a userDeposit call
        // You could add more validation here to ensure it's the correct function call
        // Update user balance atomically
        const updatedUser = await User.findOneAndUpdate({ walletAddress }, { $inc: { DepositBalance: amount } }, { new: true });
        if (!updatedUser) {
            return res.status(500).json({
                success: false,
                message: "Failed to update user balance"
            });
        }
        res.status(200).json({
            success: true,
            message: "Funds deposited successfully",
            user: updatedUser,
            transactionHash: txHash
        });
    }
    catch (error) {
        console.error("Deposit funds error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
DepositFundsRouter.post("/dp", depositFunds);
export default DepositFundsRouter;
//# sourceMappingURL=route.js.map