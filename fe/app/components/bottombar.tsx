"use client"

import { useAccount } from "wagmi";
import { useGame } from "../store/useGame";
  import { useState, useEffect, useRef } from "react";
  import { cachePayouts, getCachedPayouts, clearCache } from "../services/api";
  import { useQuery, useQueryClient } from "@tanstack/react-query";
  import { toast } from "react-toastify";
  import DepositDialog from "./DepositDialog";
  import { FetchDepositFunds } from "../services/OnchainApi/api";
  import { useBalance } from "wagmi";
  import { WithdrawFunds } from "../services/OnchainApi/api";
  import { useWalletClient } from "wagmi";


const BottomBar = ()=>{
  const { address: walletAddress } = useAccount();
  const queryClient = useQueryClient();
  const { isPlaying, roundEnded, diedOnDeathTile, start, payoutAmount, cumulativePayoutAmount, rehydrate, setCumulativePayoutAmount, Replay, setReplay, totalLoss } = useGame();
  const [finalPayoutAmount, setFinalPayoutAmount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const deathToastShownRef = useRef(false);
  const [finalPayoutAmountMON, setFinalPayoutAmountMON] = useState("0.0000"); // Final payout amount in MON
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositFunds, setDepositFunds] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [justStartedFresh, setJustStartedFresh] = useState(false);
  const [isMonitoringDeposit, setIsMonitoringDeposit] = useState(false);
  const [expectedBalance, setExpectedBalance] = useState<number | null>(null);
  const { data: balance } = useBalance({address: walletAddress});
  const { data: walletClient } = useWalletClient();



    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if(finalPayoutAmount > 0){
        const FinalMONifDeath = finalPayoutAmount / 150;
        setFinalPayoutAmountMON(FinalMONifDeath.toFixed(4));
      } else {
        setFinalPayoutAmountMON("0.0000");
      }
    }, [finalPayoutAmount]);

    
  // live cache while playing
  useEffect(() => {
    if (isPlaying && !roundEnded && walletAddress) {
      cachePayouts({ key: walletAddress, value: cumulativePayoutAmount, roundEnded: false, walletAddress });
      if(cumulativePayoutAmount > 0){
        const ethEarned = (cumulativePayoutAmount / 150).toFixed(4); // Convert Death Points to ETH
        toast.success(`MON Earned ${ethEarned} ++`);
      }
    }
    }, [isPlaying, roundEnded, cumulativePayoutAmount, walletAddress]);
    
    // lock final on end and commit
    useEffect(() => {
    if (roundEnded) {
      // Always set finalPayoutAmount to the current cumulativePayoutAmount when round ends
      setFinalPayoutAmount(cumulativePayoutAmount);
      // toast.success(`Round ended. You earned ${cumulativePayoutAmount.toFixed(2)}`);
    }
    }, [roundEnded, cumulativePayoutAmount]);
    
    // cache final payout while playing
    useEffect(() => {
    if (roundEnded && walletAddress) {
      // Only show death toast once per round
      if (diedOnDeathTile && !deathToastShownRef.current) {
        // Show total loss amount (stake + earnings lost)
        const totalLossETH = totalLoss.toFixed(4);
        toast.error(`Death tile hit! You lost everything: ${totalLossETH} MON (stake + earnings). Round ended.`);  
        deathToastShownRef.current = true;
        // setReplay(true);
      }
      // Use cumulativePayoutAmount for caching since it's the actual final amount (0 on death)
      cachePayouts({ key: walletAddress, value: cumulativePayoutAmount, roundEnded: true, walletAddress });
    }
    }, [roundEnded, cumulativePayoutAmount, walletAddress, diedOnDeathTile, totalLoss]);
    
    // read cached payout on mount/reload (enabled when wallet exists, regardless of playing state)
    const { data: cachedData, isLoading: isCachedLoading } = useQuery({
    queryKey: ["cachedPayouts", walletAddress, roundEnded ? "final" : "live"],
    queryFn: () => getCachedPayouts(walletAddress as string),
    enabled: mounted && !!walletAddress,
    });
    
    const cachedRaw = cachedData?.payout as unknown;
    const cachedNum = cachedRaw != null ? Number(cachedRaw) : null;


    // Rehydrate earnings from cache when mounted (but not after fresh start or if Replay is set)
    useEffect(() => {
      if (mounted && cachedNum != null && Number.isFinite(cachedNum) && !justStartedFresh && !Replay) {
        if (isPlaying && !roundEnded && cumulativePayoutAmount === 0) {
          // Rehydrate during active play
          console.log("[BottomBar] rehydrating earnings from cache:", cachedNum);
          setCumulativePayoutAmount(cachedNum);
        } else if (roundEnded && finalPayoutAmount === 0 && !diedOnDeathTile) {
          // Only rehydrate final payout if we didn't die on death tile
          console.log("[BottomBar] rehydrating final payout from cache:", cachedNum);
          setFinalPayoutAmount(cachedNum);
          setCumulativePayoutAmount(cachedNum);
        }
      } else if (justStartedFresh || Replay || diedOnDeathTile) {
        console.log("[BottomBar] Skipping rehydration - fresh start, replay, or died on death tile");
      }
    }, [mounted, isPlaying, roundEnded, cachedNum, cumulativePayoutAmount, finalPayoutAmount, setCumulativePayoutAmount, justStartedFresh, Replay, diedOnDeathTile]);

    // Debug logging
    console.log("[BottomBar] state:", { 
      isPlaying, 
      roundEnded, 
      diedOnDeathTile,
      cumulativePayoutAmount, 
      finalPayoutAmount, 
      totalLoss,
      cachedRaw, 
      cachedNum,
      isCachedLoading,
      walletAddress,
      depositFunds,
      mounted,
      isLoadingBalance,
      isMonitoringDeposit
    });


    const handleStart = ()=>{
      start();
      deathToastShownRef.current = false; // Reset death toast flag for new game
      setReplay(false);
      toast.success(`Round started.`);
    }


    const handleReplay = ()=>{
      // setReplay(true);
      start(); // ✅ Start the game
      deathToastShownRef.current = false;
      setReplay(true);
      toast.success(`Round replayed.`);
    }


    const handleStartGame = async (isReplay: boolean = false) => {
      try {
        // Set this FIRST to prevent rehydration from running during start
        setJustStartedFresh(true); 
        setFinalPayoutAmount(0);
        deathToastShownRef.current = false;
        
        // Clear cache before starting any game (demo or replay)
        if (walletAddress) {
          await clearCache(walletAddress);
          console.log("[BottomBar] Cache cleared for", isReplay ? "replay" : "start");
          
          // Invalidate React Query cache for this wallet
          queryClient.invalidateQueries({ 
            queryKey: ["cachedPayouts", walletAddress] 
          });
          console.log("[BottomBar] React Query cache invalidated");
        }
        
        // Start game AFTER setting justStartedFresh flag
        start(); // This already resets cumulativePayoutAmount and other game state
        setReplay(isReplay);
        
        // Reset the flag after a brief delay
        setTimeout(() => setJustStartedFresh(false), 1000);
        
        const message = isReplay ? "Round replayed. Cache cleared." : "Round started.";
        toast.success(message);
        
      } catch (error) {
        console.error("Error clearing cache:", error);
        // Still start the game even if cache clear fails
        setJustStartedFresh(true); // Set this FIRST
        setFinalPayoutAmount(0);
        deathToastShownRef.current = false;
        start(); // This already handles the state reset
        setReplay(isReplay);
        
        // Reset the flag after a brief delay
        setTimeout(() => setJustStartedFresh(false), 1000);
        
        const message = isReplay ? "Round replayed." : "Round started.";
        toast.success(message);
      }
    };


    const fetchUserBalance = async () => {
      if(walletAddress){
        setIsLoadingBalance(true);
        console.log("Fetching deposit balance for:", walletAddress);
        try {
          const res = await FetchDepositFunds(walletAddress);
          console.log("Deposit balance response:", res.data);
          const newBalance = res.data.user.DepositBalance;
          setDepositFunds(newBalance);
          console.log("Set deposit funds to:", newBalance);
          return newBalance;
        } catch (error) {
          console.error("Error fetching deposit balance:", error);
          throw error;
        } finally {
          setIsLoadingBalance(false);
        }
      }
    };




    // Fetch deposit funds when wallet address changes
    useEffect(()=>{
      if (walletAddress) {
        fetchUserBalance();
      }
    }, [walletAddress])

    // Reset deposit funds to 0 ONLY when user dies (not when they win)
    useEffect(() => {
      if (diedOnDeathTile && roundEnded) {
        console.log("[BottomBar] User died - setting deposit funds to 0");
        setDepositFunds(0);
      }
    }, [diedOnDeathTile, roundEnded])

    // Monitor backend balance after deposit
    useEffect(() => {
      let intervalId: NodeJS.Timeout;
      let timeoutId: NodeJS.Timeout;
      
      if (isMonitoringDeposit && expectedBalance !== null && walletAddress) {
        console.log("[BottomBar] Starting balance monitoring for expected:", expectedBalance);
        
        const checkBalance = async () => {
          try {
            const response = await FetchDepositFunds(walletAddress);
            const currentBalance = response.data.user.DepositBalance;
            
            console.log("[BottomBar] Backend balance check:", currentBalance, "expected:", expectedBalance);
            
            if (currentBalance >= expectedBalance) {
              // Backend has processed the deposit!
              console.log("[BottomBar] Backend processed deposit successfully!");
              setIsMonitoringDeposit(false);
              setExpectedBalance(null);
              
              // Refresh the balance and show success
              await fetchUserBalance();
              toast.success("Deposit processed! You can now start playing.");
            }
          } catch (error) {
            console.error("[BottomBar] Error checking backend balance:", error);
          }
        };
        
        // Check immediately, then every 2 seconds
        checkBalance();
        intervalId = setInterval(checkBalance, 2000);
        
        // Stop checking after 30 seconds (timeout)
        timeoutId = setTimeout(() => {
          console.log("[BottomBar] Balance check timeout - refreshing anyway");
          setIsMonitoringDeposit(false);
          setExpectedBalance(null);
          fetchUserBalance();
          toast.info("Deposit processed - balance updated!");
        }, 30000);
      }
      
      return () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [isMonitoringDeposit, expectedBalance, walletAddress]);

    // Function to start monitoring after deposit
    const startDepositMonitoring = (depositAmount: number) => {
      const newExpectedBalance = depositFunds + depositAmount;
      console.log("[BottomBar] Starting deposit monitoring for amount:", depositAmount, "expected balance:", newExpectedBalance);
      
      // Optimistic UI update - immediately update frontend
      setDepositFunds(newExpectedBalance);
      console.log("[BottomBar] Optimistic UI update - set deposit funds to:", newExpectedBalance);
      
      setExpectedBalance(newExpectedBalance);
      setIsMonitoringDeposit(true);
      toast.info("Processing deposit on blockchain...");
    };



    // Spinner component
    const LoadingSpinner = () => (
      <div className="flex items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-lime-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-2 text-lime-400">Loading...</span>
      </div>
    );


    const handleDialogOpen = () => {
      if(balance && parseFloat(balance.formatted) < depositFunds){
        toast.error("You don't have enough balance to deposit");
        return;
      } else {
        setIsDepositDialogOpen(true);
      }
    }






    // Handle withdraw

    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const handleWithdraw = async () => {
      if (!walletClient || !depositFunds || depositFunds <= 0) {
        toast.error("No funds available to withdraw");
        return;
      }

      try {
        setIsWithdrawing(true);
        
        // Calculate total withdrawable amount (deposits + current earnings)
        const currentEarnings = (cumulativePayoutAmount / 150); // Convert death points to ETH
        const totalWithdrawable = depositFunds + currentEarnings;
        
        console.log("[Withdraw] Withdrawing:", totalWithdrawable, "ETH");
        toast.info("Processing withdrawal...");

        // Convert wagmi client to ethers signer
        const { ethers } = await import("ethers");
        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();
        
        const response = await WithdrawFunds(totalWithdrawable, signer);
        
        if (response.status === 200) {
          const txHash = response.data.data?.transactionHash || 'unknown';
          console.log("🎉 WITHDRAWAL SUCCESS! Transaction Hash:", txHash);
          console.log("💰 Amount withdrawn:", totalWithdrawable.toFixed(4), "MON");
          console.log("📝 Full response:", response.data);
          
          toast.success(`Successfully withdrew ${totalWithdrawable.toFixed(4)} MON! TX: ${txHash.slice(0, 10)}...`);
          
          // End the current round completely
          console.log("🏁 Ending round after withdrawal...");
          setCumulativePayoutAmount(0);
          setFinalPayoutAmount(0);
          setDepositFunds(0);
          
          // Reset ALL game state to return to initial state
          useGame.setState({
            isPlaying: false,
            roundEnded: false,
            diedOnDeathTile: false,
            cumulativePayoutAmount: 0,
            payoutAmount: 0,
            totalLoss: 0,
            Replay: false
          });
          
          console.log("🔄 Game state completely reset after withdrawal");
          
          // Clear cache
          if (walletAddress) {
            await clearCache(walletAddress);
            queryClient.invalidateQueries({ queryKey: ["cachedPayouts", walletAddress] });
            console.log("🧹 Cache cleared after withdrawal");
          }
          
          // Refresh balance from backend
          await fetchUserBalance();
          console.log("💾 Balance refreshed from backend");
        }
        
      } catch (error: any) {
        console.error("Withdrawal error:", error);
        const errorMessage = error.response?.data?.message || error.message || "Withdrawal failed";
        const maxWithdrawable = error.response?.data?.maxWithdrawable;
        
        if (maxWithdrawable && maxWithdrawable > 0) {
          toast.error(`${errorMessage}. You can withdraw up to ${maxWithdrawable.toFixed(4)} ETH currently.`);
        } else {
          toast.error(errorMessage);
        }
      } finally {
        setIsWithdrawing(false);
      }
    };

    
	
	return (
      <>
      <div className="fixed inset-x-0 bottom-6 flex justify-center px-4 ">
         <div className="w-full max-w-2xl bg-[#0b1206]/95 border border-gray-900 rounded-2xl px-6 pt-10 pb-6  shadow-gray-900 shadow-inner">
          
        <div className="flex flex-col justify-between items-center gap-4">
    {/* Left */}
    <div>
      {!mounted || isLoadingBalance || isMonitoringDeposit ? (
        <LoadingSpinner />
      ) : !isPlaying && walletAddress ? (
        <>
        {depositFunds > 0 ? (
          // User has deposited funds - show Start button and balance
          <div className="flex flex-col gap-4 items-center">
            <div className="flex justify-between items-center gap-4 w-full">
              <button 
                onClick={() => handleStartGame(diedOnDeathTile)} 
                 className="min-w-[200px] h-12 cursor-pointer rounded-md bg-lime-400 text-black font-bold tracking-wide hover:bg-lime-300 transition-colors text-lg"
              >
                {diedOnDeathTile ? "Replay" : "Start Game"}
              </button>
              
              <div className="flex flex-col items-center gap-1">
                <span className="text-gray-400 text-sm">Deposited Balance</span>
                <span className="text-lime-400 text-xl font-bold">{depositFunds.toFixed(4)} MON</span>
              </div>
            </div>
          </div>
        ) : (
          // User hasn't deposited - show demo and deposit options
          <>
          <div className="flex justify-between items-end gap-4">
            <div className="flex flex-col gap-2">
              <button 
                onClick={diedOnDeathTile ? handleReplay : handleStart} 
                className="min-w-[180px] h-10 cursor-pointer rounded-md bg-lime-400 text-black font-bold tracking-wide hover:bg-lime-300 transition-colors"
              >
                {diedOnDeathTile ? "play Demo" : "Play Demo"}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleDialogOpen()}
                className="min-w-[180px] h-10 cursor-pointer rounded-md bg-lime-400 text-black font-bold tracking-wide hover:bg-lime-300 transition-colors"
              >
                Add Funds
              </button>
            </div>
          </div>
          <div className="w-full flex justify-center mt-2">
            <span className="text-lime-400 text-lg text-center">You need to add funds to play and earn</span>
          </div>
          </>
        )}
        </>
      
      ) :
      
      !isPlaying && !walletAddress ? (
        <span>Connect Wallet To Play</span>
      ) : isPlaying ? (
        <span></span>
      ) : (
								<span>Round Ended</span>
      )}
				</div>

    {/* Right */}
    <div className="w-full flex justify-center">
    {!mounted ? (
      <span className="text-lime-400 text-sm">Earnings: ...</span>
    ) : isPlaying ? (
      <div className="flex flex-col gap-2">
      <span className="text-lime-400 text-xl">Earnings: { (cumulativePayoutAmount / 150).toFixed(4) } MON</span>

      {depositFunds > 0 && (
        <div className="flex justify-center">
          <button 
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="bg-lime-400 text-black cursor-pointer hover:bg-lime-300 transition-colors font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWithdrawing ? "Withdrawing..." : "Withdraw"}
          </button>
        </div>
      )}
					</div>
    ) : roundEnded ? (
      <div className="flex flex-row justify-between items-center gap-4">

      <span className="text-lime-400 text-xl py-2">
        {diedOnDeathTile ? "Final Earnings: 0.0000 MON" : `Final Earnings: ${finalPayoutAmountMON} MON`}
      </span>
    
    </div>
    ) : null}
  </div>
  </div>
			</div>
		</div>

      {/* Deposit Dialog */}
      <DepositDialog 
        isOpen={isDepositDialogOpen} 
        onClose={() => setIsDepositDialogOpen(false)}
        onDepositSuccess={startDepositMonitoring}
      />
    </>
	)
}

export default BottomBar;
