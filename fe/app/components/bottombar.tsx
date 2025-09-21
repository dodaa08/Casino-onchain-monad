"use client"

import { useAccount } from "wagmi";
import { useGame } from "../store/useGame";
import { useState, useEffect, useRef } from "react";
import { cachePayouts, getCachedPayouts } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

const BottomBar = ()=>{
	const { address: walletAddress } = useAccount();
	const { isPlaying, roundEnded, diedOnDeathTile, start, payoutAmount, cumulativePayoutAmount, rehydrate, setCumulativePayoutAmount, Replay, setReplay } = useGame();
	const [finalPayoutAmount, setFinalPayoutAmount] = useState(0);
	const [mounted, setMounted] = useState(false);
	const deathToastShownRef = useRef(false);

	useEffect(() => {
		setMounted(true);
	}, []);

  // const earnings = cumulativePayoutAmount - finalPayoutAmount;
  

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
		setFinalPayoutAmount(cumulativePayoutAmount);
		// toast.success(`Round ended. You earned ${cumulativePayoutAmount.toFixed(2)}`);
	}
  }, [roundEnded, cumulativePayoutAmount]);
  
  // cache final payout while playing
  useEffect(() => {
	if (roundEnded && walletAddress) {
		// Only show death toast once per round
		if (diedOnDeathTile && !deathToastShownRef.current) {
			const ethEarned = (cumulativePayoutAmount / 150).toFixed(4);
			toast.error("Death tile hit. Round ended. You earned "+ ethEarned + "MON");
			deathToastShownRef.current = true;
      // setReplay(true);
		}
	  cachePayouts({ key: walletAddress, value: finalPayoutAmount, roundEnded: true, walletAddress });
	}
  }, [roundEnded, finalPayoutAmount, walletAddress, diedOnDeathTile, cumulativePayoutAmount]);
  
  // read cached payout on mount/reload (enabled when wallet exists, regardless of playing state)
  const { data: cachedData, isLoading: isCachedLoading } = useQuery({
	queryKey: ["cachedPayouts", walletAddress, roundEnded ? "final" : "live"],
	queryFn: () => getCachedPayouts(walletAddress as string),
	enabled: mounted && !!walletAddress,
  });
  
  const cachedRaw = cachedData?.payout as unknown;
  const cachedNum = cachedRaw != null ? Number(cachedRaw) : null;


  // Rehydrate earnings from cache when mounted and playing
  useEffect(() => {
    if (mounted && isPlaying && !roundEnded && cachedNum != null && Number.isFinite(cachedNum) && cumulativePayoutAmount === 0) {
      console.log("[BottomBar] rehydrating earnings from cache:", cachedNum);
      setCumulativePayoutAmount(cachedNum);
      // toast.success(`Rehydrating earnings from cache: ${cachedNum.toFixed(2)}`);
      
    }
  }, [mounted, isPlaying, roundEnded, cachedNum, cumulativePayoutAmount, setCumulativePayoutAmount]);

  // Debug logging
  // console.log("[BottomBar] state:", { 
  //   isPlaying, 
  //   roundEnded, 
  //   cumulativePayoutAmount, 
  //   finalPayoutAmount, 
  //   cachedRaw, 
  //   cachedNum,
  //   isCachedLoading,
  //   walletAddress
  // });

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

	return (
		<div className="fixed inset-x-0 bottom-6 flex justify-center px-4">
			<div className="w-full max-w-2xl bg-[#0b1206]/95 border border-gray-900 rounded-2xl px-6 py-5  shadow-gray-900 shadow-inner">
				 
			<div className="flex flex-col justify-between items-center gap-4">
  {/* Left */}
  <div>
    {!mounted ? (
      <span>...</span>
    ) : !isPlaying && walletAddress ? (
      <button 
      onClick={diedOnDeathTile ? handleReplay : handleStart} 
      className="min-w-[180px] mt-2 h-10 rounded-md bg-lime-400 text-black font-bold tracking-wide hover:bg-lime-300 transition-colors"
    >
      {diedOnDeathTile ? "Replay" : "Play"}
    </button>
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
    <span className="text-lime-400 text-xl">Earnings: {cumulativePayoutAmount.toFixed(2)}</span>

    <div className="flex justify-center">
      <button className="bg-lime-400 text-black cursor-pointer hover:bg-lime-300 transition-colors font-semibold px-4 py-2 rounded-md">Withdraw</button>
    </div>  
    </div>
  ) : roundEnded ? (
    <span className="text-lime-400 text-xl">Final Earnings:  {cumulativePayoutAmount.toFixed(2)}</span>
  ) : null}
</div>
</div>
			</div>
		</div>
	)
}

export default BottomBar;
