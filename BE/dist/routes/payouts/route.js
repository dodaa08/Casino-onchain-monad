import { User } from "../../Db/schema.js";
import { Router } from "express";
import { Payout } from "../../Db/schema.js";
import { PoolABI } from "../../contracts/abi.js";
import { ethers } from "ethers";
import { JsonRpcProvider, Wallet } from "ethers";
import dotenv from "dotenv";
dotenv.config();
const rawPk = (process.env.PRIVATE_KEY || "").trim();
if (!rawPk)
    throw new Error("Missing PRIVATE_KEY");
const pk = rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`;
if (!/^0x[0-9a-fA-F]{64}$/.test(pk))
    throw new Error("PRIVATE_KEY must be 0x + 64 hex");
const rpcUrl = (process.env.MONAD_TESTNET_RPC || "").trim();
if (!rpcUrl)
    throw new Error("Missing MONAD_TESTNET_RPC");
const provider = new JsonRpcProvider(rpcUrl);
export const payoutWallet = new Wallet(pk, provider);
const poolAddress = (process.env.Contract_Address || "").trim();
if (!/^0x[0-9a-fA-F]{40}$/.test(poolAddress)) {
    throw new Error("Invalid Contract_Address");
}
// const provider = new JsonRpcProvider(process.env.MONAD_TESTNET_RPC || "");
const signer = new ethers.Wallet(pk, provider);
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
PayoutsRouter.post("/", payouts);
export default PayoutsRouter;
//# sourceMappingURL=route.js.map