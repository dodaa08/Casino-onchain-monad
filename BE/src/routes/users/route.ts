import { Router } from "express";
import { User } from "../../Db/schema.js";
const UserRouter = Router();


const createUser = async (req: any, res: any) => {
    const {walletAddress, balance} = req.body;

    try{
        const user = await User.findOne({walletAddress});
        if(user){
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        const newUser = await User.create({
            walletAddress : walletAddress,
            balance : balance,
            payouts : 0,
            totalEarned : 0,
            roundsPlayed : 0,
            DepositBalance : 0,
        });
        res.status(200).json({ success: true, message: "User created successfully", user: newUser });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


const getUser = async (req: any, res: any) => {
    const {walletAddress} = req.params;
    try{
        const user = await User.findOne({walletAddress});
        res.status(200).json({ success: true, user });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const getAllUsersWithtotalEarned = async (req: any, res: any) => {
    try{
        const users = await User.find();
        const usersWithtotalEarned = users.map((user) => ({
            walletAddress: user.walletAddress,
            totalEarned: user.totalEarned,
        }));
        res.status(200).json({ success: true, usersWithtotalEarned });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


UserRouter.post("/get-user/:walletAddress", getUser);
UserRouter.post("/create-user", createUser);
UserRouter.post("/leaderboard-data", getAllUsersWithtotalEarned);
export default UserRouter;