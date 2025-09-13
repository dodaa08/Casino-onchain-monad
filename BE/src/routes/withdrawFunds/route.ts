import { Router } from "express";
import { User } from "../../Db/schema.js";
import { ethers } from "ethers";
import { PoolABI } from "../../contracts/abi.js";

const poolAddress = process.env.Contract_Address || "";
const provider = new ethers.JsonRpcProvider(process.env.MONAD_TESTNET_RPC || "");
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const poolContract = new ethers.Contract(poolAddress, PoolABI, signer) as any;

const WithdrawFundsRouter = Router();

// this is connected to the undepoloyed contract Function will be added soon..


const withdrawFunds = async (req: any, res: any) => {
    const {walletAddress, amount} = req.body;
    try{
        const user = await User.findOne({walletAddress});
        if(!user){
            return res.status(400).json({ success: false, message: "User not found" });
        }
        const withdrawTx = await poolContract.userWithdraw(walletAddress, ethers.parseEther(amount.toString()));
        await withdrawTx.wait();
        if(withdrawTx){
            await User.updateOne({walletAddress}, {DepositBalance: user.DepositBalance - amount});
            await User.updateOne({walletAddress}, {balance: user.balance + amount});
            await User.updateOne({walletAddress}, {totalEarned: user.totalEarned + amount});
            await User.updateOne({walletAddress}, {roundsPlayed: user.roundsPlayed + 1});
            await User.updateOne({walletAddress}, {payouts: user.payouts = 0});
            res.status(200).json({ success: true, message: "Funds withdrawn successfully", user });
        }
        else{
            return res.status(400).json({ success: false, message: "Withdrawal failed" });
        }
    }
    catch(error){
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


WithdrawFundsRouter.post("/withdrawFunds", withdrawFunds);


export default WithdrawFundsRouter;