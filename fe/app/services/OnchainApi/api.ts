import { ethers } from "ethers";
import { PoolABI } from "@/app/contracts/abi";
import axios from "axios";
import { toast } from "react-toastify";


const poolAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

// Deposit funds using user's connected wallet
export const DepositFunds = async (amount: number, signer: ethers.Signer) => {
    if (!amount || amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }
    
    if (!signer) {
        throw new Error("Wallet not connected");
    }
    
    try {
        const poolContract = new ethers.Contract(poolAddress, PoolABI, signer);
        
        const depositTx = await poolContract.userDeposit({
            value: ethers.parseEther(amount.toString()),
        });
        
        const receipt = await depositTx.wait();
        console.log("depositTx", depositTx);
        console.log("poolAddress", poolAddress);
        console.log("amount", amount);


        // Get wallet address
        const walletAddress = await signer.getAddress();
        
        console.log("Transaction receipt:", receipt);
        console.log("Transaction hash from receipt:", receipt?.hash);
        console.log("Transaction hash from depositTx:", depositTx.hash);
        
        const txHash = receipt?.hash || depositTx.hash;
        
        console.log("Sending to backend:", {
            walletAddress: walletAddress,
            amount: amount,
            txHash: txHash,
            url: `${process.env.NEXT_PUBLIC_BE_URL}/api/depositFunds/dp`
        });
        
        console.log("Data types:", {
            walletAddressType: typeof walletAddress,
            amountType: typeof amount,
            txHashType: typeof txHash,
            amountValue: amount,
            txHashLength: txHash?.length
        });

        if(txHash == null){
            throw new Error("Transaction hash is null");
        }

        let backendResponse = null;
        if(txHash && txHash.length > 0 && walletAddress && amount){
            backendResponse = await axios.post(`${process.env.NEXT_PUBLIC_BE_URL}/api/depositFunds/dp`, {
                walletAddress: walletAddress,
                amount: amount,
                txHash: txHash
            });
            
            if(backendResponse.status !== 200){
                throw new Error("Failed to deposit funds");
            }
        }
            toast.success("Database updated successfully");

        return backendResponse;
    } catch (error: any) {
        console.error("DepositFunds error:", error);
        
        // If it's an axios error, log the response details
        if (error.response) {
            console.error("Backend error response:", {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
            console.error("Backend error message:", error.response.data);
            throw new Error(`Backend error: ${error.response.data?.message || error.response.statusText}`);
        }
        
        throw error;
    }
}


export const FetchDepositFunds = async (walletAddress: string) => {
    const backendResponse = await axios.post(`${process.env.NEXT_PUBLIC_BE_URL}/api/depositFunds/fd`, {
        walletAddress: walletAddress
    });
    return backendResponse;
}











