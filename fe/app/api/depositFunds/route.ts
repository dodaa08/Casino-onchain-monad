import { ethers } from "ethers";
import { PoolABI } from "@/app/contracts/abi";

const poolAddress = process.env.Contract_Address || "";
const provider = new ethers.JsonRpcProvider(process.env.MONAD_TESTNET_RPC || "");
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const poolContract = new ethers.Contract(poolAddress, PoolABI, signer) as any;

export async function POST(req: any) {
    try {
        const { amount, walletAddress } = await req.json();
        
        // Input validation
        if (!amount || amount <= 0) {
            return Response.json(
                { success: false, message: "Invalid amount" },
                { status: 400 }
            );
        }
        
        if (!walletAddress) {
            return Response.json(
                { success: false, message: "Wallet address is required" },
                { status: 400 }
            );
        }

        // Convert amount to wei
        const amountInWei = ethers.parseEther(amount.toString());
        
        // Estimate gas for the transaction
        const gasEstimate = await poolContract.userDeposit.estimateGas({
            value: amountInWei
        });
        
        // Execute the deposit transaction with ETH value
        const depositTx = await poolContract.userDeposit({
            value: amountInWei,
            // gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        });
        
        // Wait for transaction confirmation
        const receipt = await depositTx.wait();
        
        if (receipt.status === 1) { // Transaction successful
            // Call backend API to update user balance
            try {
                const backendResponse = await fetch(`${process.env.BE_URL}/api/depositFunds/dp`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        walletAddress: walletAddress,
                        amount: amount,
                        txHash: receipt.transactionHash
                    }),
                });
                
                const backendData = await backendResponse.json();
                
                if (backendData.success) {
                    return Response.json({
                        success: true,
                        message: "Funds deposited successfully",
                        data: {
                            transactionHash: receipt.transactionHash,
                            amount: amount,
                            user: backendData.user
                        }
                    });
                } else {
                    // Contract transaction succeeded but backend failed
                    return Response.json({
                        success: false,
                        message: "Funds deposited to contract but database update failed",
                        transactionHash: receipt.transactionHash,
                        error: backendData.message
                    }, { status: 500 });
                }
            } catch (backendError) {
                console.error("Backend API error:", backendError);
                return Response.json({
                    success: false,
                    message: "Funds deposited to contract but backend communication failed",
                    transactionHash: receipt.transactionHash
                }, { status: 500 });
            }
        } else {
            return Response.json({
                success: false,
                message: "Transaction failed"
            }, { status: 400 });
        }
        
    } catch (error: any) {
        console.error("Deposit error:", error);
        
        // Handle specific contract errors
        if (error.message?.includes("insufficient funds")) {
            return Response.json({
                success: false,
                message: "Insufficient funds for transaction"
            }, { status: 400 });
        }
        
        if (error.message?.includes("user rejected")) {
            return Response.json({
                success: false,
                message: "Transaction rejected by user"
            }, { status: 400 });
        }
        
        return Response.json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}