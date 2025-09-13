import { User } from "../../Db/schema.js";
import { Router } from "express";
import { Payout } from "../../Db/schema.js";
import { PoolABI } from "../../contracts/abi.js";
import { ethers } from "ethers";
import { JsonRpcProvider } from "ethers";
// const poolAddress = process.env.Contract_Address || "";
const poolAddress = process.env.Contract_Address || "";
const provider = new JsonRpcProvider(process.env.MONAD_TESTNET_RPC || "");
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const poolContract = new ethers.Contract(poolAddress, PoolABI, signer);
const PayoutsRouter = Router();
const payouts = async (req, res) => {
    const { walletAddress, amount } = req.body;
    try {
        const user = await User.findOne({ walletAddress });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        const payoutTx = await poolContract.payout(walletAddress, ethers.parseEther(amount.toString()));
        await payoutTx.wait();
        console.log(payoutTx);
        console.log(poolAddress);
        console.log(walletAddress);
        console.log(amount);
        if (payoutTx) {
            await Payout.create({ user: user._id, amount, txHash: payoutTx.hash });
            // await User.updateOne({walletAddress}, {DepositBalance: user.DepositBalance - amount});
            // await User.updateOne({walletAddress}, {balance: user.balance + amount});
            // await User.updateOne({walletAddress}, {totalEarned: user.totalEarned + amount});
            // await User.updateOne({walletAddress}, {roundsPlayed: user.roundsPlayed + 1});
            // await User.updateOne({walletAddress}, {payouts: user.payouts = 0});
            await User.updateOne({ walletAddress }, {
                $inc: {
                    DepositBalance: -amount, // ✅
                    balance: amount, // ✅
                    totalEarned: amount, // ✅
                    roundsPlayed: 1 // ✅
                },
                $set: {
                    payouts: 0
                }
            });
            res.status(200).json({ success: true, message: "Payouts successful", user });
        }
        else {
            return res.status(400).json({ success: false, message: "Payout failed" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
PayoutsRouter.post("/payouts", payouts);
export default PayoutsRouter;
//# sourceMappingURL=route.js.map