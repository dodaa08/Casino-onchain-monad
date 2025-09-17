"use client"

import { useAccount } from "wagmi";
import { useGame } from "../store/useGame";


const BottomBar = ()=>{

	const {address: walletAddress} = useAccount();
	const {isPlaying, roundEnded, start} = useGame();
	
	return (
		<div className="fixed inset-x-0 bottom-6 flex justify-center px-4">
			<div className="w-full max-w-2xl bg-[#0b1206]/95 border border-gray-900 rounded-2xl px-6 py-8  shadow-gray-900 shadow-inner">
				<div className="flex items-center justify-center gap-6">

										{
						!isPlaying && walletAddress ? (
							<button onClick={start} className="min-w-[180px] h-10 rounded-md bg-lime-400 text-black font-semibold tracking-wide hover:bg-lime-300 transition-colors">Play</button>
						) 
						:
						!isPlaying && !walletAddress ? (
							<>
								<span>Connect Wallet To Play</span>
							</>
						)
						:
						   isPlaying ? (
							<>
								{/* <button onClick={start} className="min-w-[180px] h-10 rounded-md bg-lime-400 text-black font-semibold tracking-wide hover:bg-lime-300 transition-colors">Playing</button> */}
								<span>Playing</span>
							</>
						) : (
							<>
								<span>Round Ended</span>
							</>
						)
					}
{/* 					
					<button  className="min-w-[180px] h-10 rounded-md bg-white text-black font-semibold tracking-wide hover:bg-gray-100 transition-colors">Deposit</button> */}
				</div>
				{/* <div className="mt-4 flex items-center justify-center gap-6 text-sm">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Deposited</span>
						
					</div>
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Earned</span>
						
					</div> */}
				{/* </div> */}
			</div>
		</div>
	)
}

export default BottomBar;
