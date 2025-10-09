import { User } from "../../Db/schema.js";
import { Router } from "express";
import { Payout } from "../../Db/schema.js";
import { PoolABI } from "../../contracts/abi.js";
import { ethers } from "ethers";
import { JsonRpcProvider, Wallet } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const rawPk = (process.env.PRIVATE_KEY || "").trim();
if (!rawPk) throw new Error("Missing PRIVATE_KEY");
const pk = rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`;
if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) throw new Error("PRIVATE_KEY must be 0x + 64 hex");

const rpcUrl = (process.env.MONAD_TESTNET_RPC || "").trim();
if (!rpcUrl) throw new Error("Missing MONAD_TESTNET_RPC");

const provider = new JsonRpcProvider(rpcUrl);
export const payoutWallet = new Wallet(pk, provider);
const poolAddress = (process.env.Contract_Address || "").trim();
if (!/^0x[0-9a-fA-F]{40}$/.test(poolAddress)) {
  throw new Error("Invalid Contract_Address");
}
// const provider = new JsonRpcProvider(process.env.MONAD_TESTNET_RPC || "");
const signer = new ethers.Wallet(pk, provider);
const poolContract = new ethers.Contract(poolAddress, PoolABI, signer) as any;

const PayoutsRouter = Router();

const payouts = async (req: any, res: any) => {
    const {walletAddress, amount} = req.body;
    try{
        const user = await User.findOne({walletAddress});
        if(!user){
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const payoutTx = await poolContract.payout(walletAddress, ethers.parseEther(amount.toString()));
        await payoutTx.wait();

        console.log(payoutTx);
        console.log(poolAddress);
        console.log(walletAddress);
        console.log(amount);
       
       if(payoutTx){
        await Payout.create({user: user._id, amount, txHash: payoutTx.hash});
        
        await User.updateOne({walletAddress}, {
            $inc: {
                DepositBalance: -amount,      // ✅
                balance: amount,              // ✅
                totalEarned: amount,          // ✅
                roundsPlayed: 1              // ✅
            },
            $set: {
                payouts: 0
            }
        });

        res.status(200).json({ success: true, message: "Payouts successful", user });
       }
       else{
        return res.status(400).json({ success: false, message: "Payout failed" });
       }
    }
    catch(error){
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// Separate function for referral reward payout
const referralPayout = async (req: any, res: any) => {
    const { walletAddress, amount } = req.body;
    try {
        const user = await User.findOne({ walletAddress });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        if (!user.isReferred || !user.referrer) {
            return res.status(400).json({ success: false, message: "User has no referrer" });
        }

        const referralReward = amount * 0.05; // 5% of the specified amount
        console.log(`Referral reward payout of ${referralReward} MON to referrer: ${user.referrer}`);

        // Payout to referrer
        const referrerPayoutTx = await poolContract.payout(user.referrer, ethers.parseEther(referralReward.toString()));
        await referrerPayoutTx.wait();
        console.log(`Referrer payout successful: ${referralReward} MON to ${user.referrer}`, referrerPayoutTx);

        if (referrerPayoutTx) {
            const referrerUser = await User.findOne({ walletAddress: user.referrer });
            if (referrerUser) {
                await Payout.create({ user: referrerUser._id, amount: referralReward, txHash: referrerPayoutTx.hash });
                // Increase referrer's balance as they receive the reward
                await User.updateOne({ walletAddress: user.referrer }, {
                    $inc: {
                        DepositBalance: referralReward,
                        totalEarned: referralReward
                    }
                });
                console.log(`Updated referrer ${user.referrer} balance with ${referralReward} MON`);
                // Decrease user's balance as the reward is deducted from their stake
                await User.updateOne({ walletAddress: walletAddress }, {
                    $inc: {
                        DepositBalance: -referralReward
                    }
                });
                console.log(`Deducted ${referralReward} MON from user ${walletAddress} for referral reward`);
            }
            res.status(200).json({ success: true, message: "Referral payout successful", referralReward });
        } else {
            return res.status(400).json({ success: false, message: "Referral payout failed" });
        }
    } catch (error) {
        console.error("Referral payout error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


PayoutsRouter.post("/", payouts);
PayoutsRouter.post("/referral", referralPayout);

export default PayoutsRouter;

