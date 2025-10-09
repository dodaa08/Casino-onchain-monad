import { Router } from "express";
import { User } from "../../Db/schema.js";
import { ethers } from "ethers";
// import { PoolABI } from "../../contracts/abi.js";
// import { Payout } from "../../Db/schema.js";
const poolAddress = (process.env.CONTRACT_ADDRESS || process.env.Contract_Address || "").trim();
const provider = new ethers.JsonRpcProvider(process.env.MONAD_TESTNET_RPC || "");
// const poolContract = new ethers.Contract(poolAddress, PoolABI, provider) as any;   
const DepositFundsRouter = Router();
const depositFunds = async (req, res) => {
    const { walletAddress, amount, txHash, diedOnDeathTile } = req.body;
    console.log("Deposit request received:", { walletAddress, amount, txHash });
    console.log("Data types received:", {
        walletAddressType: typeof walletAddress,
        amountType: typeof amount,
        txHashType: typeof txHash,
        walletAddressValue: walletAddress,
        amountValue: amount,
        txHashValue: txHash
    });
    // Input validation
    if (!walletAddress || !amount || !txHash) {
        console.log("Validation failed - missing fields:", {
            hasWalletAddress: !!walletAddress,
            hasAmount: !!amount,
            hasTxHash: !!txHash
        });
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
        // Find or create user
        let user = await User.findOne({ walletAddress });
        if (!user) {
            console.log(`Creating new user for wallet: ${walletAddress}`);
            user = await User.create({
                walletAddress: walletAddress,
                DepositBalance: 0,
                balance: 0,
                totalEarned: 0,
                roundsPlayed: 0,
                payouts: 0
            });
        }
        // Verify transaction exists and is valid
        console.log(`Fetching transaction: ${txHash}`);
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
            console.log("Transaction not found on blockchain");
            return res.status(400).json({ success: false, message: "Transaction not found" });
        }
        console.log(`Transaction found, waiting for confirmation...`);
        // Wait for transaction to be mined
        const receipt = await provider.waitForTransaction(txHash);
        if (!receipt || receipt.status !== 1) {
            console.log("Transaction failed or not confirmed", { receipt });
            return res.status(400).json({
                success: false,
                message: "Transaction failed or not confirmed"
            });
        }
        console.log(`Verifying contract address. Expected: ${poolAddress}, Got: ${tx.to}`);
        // Verify transaction is to the correct contract
        if (tx.to?.toLowerCase() !== poolAddress.toLowerCase()) {
            console.log("Contract address mismatch");
            return res.status(400).json({
                success: false,
                message: `Transaction is not to the pool contract. Expected: ${poolAddress}, Got: ${tx.to}`
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
const FetchDepositFunds = async (req, res) => {
    try {
        const { walletAddress } = req.body;
        console.log("FetchDepositFunds request received:", { walletAddress });
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: walletAddress"
            });
        }
        // Find or create user if they don't exist
        let user = await User.findOne({ walletAddress });
        if (!user) {
            console.log(`Creating new user for fetch request: ${walletAddress}`);
            user = await User.create({
                walletAddress: walletAddress,
                DepositBalance: 0,
                balance: 0,
                totalEarned: 0,
                roundsPlayed: 0,
                payouts: 0
            });
        }
        res.status(200).json({
            success: true,
            message: "User balance fetched successfully",
            user: user
        });
    }
    catch (error) {
        console.error("FetchDepositFunds error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
DepositFundsRouter.post("/dp", depositFunds);
DepositFundsRouter.post("/fd", FetchDepositFunds);
export default DepositFundsRouter;
//# sourceMappingURL=route.js.map