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
    try {
        const user = await User.findOne({ walletAddress });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
            return res.status(400).json({ success: false, message: "Transaction not found" });
        }
        console.log(tx);
        console.log(poolAddress);
        console.log(tx.to);
        if (tx && tx.to?.toLowerCase() === poolAddress.toLowerCase()) {
            await User.updateOne({ walletAddress }, { DepositBalance: user.DepositBalance + amount });
            res.status(200).json({ success: true, message: "Funds deposited successfully", user });
        }
        else {
            return res.status(400).json({ success: false, message: "Transaction is not to the pool contract" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
DepositFundsRouter.post("/deposit-funds", depositFunds);
export default DepositFundsRouter;
//# sourceMappingURL=route.js.map