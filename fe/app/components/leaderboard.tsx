"use client";

import { useEffect, useState } from "react";

import { FetchLeaderboardData } from "../services/OnchainApi/api";
// import { useEffect, useState } from "react";

type LeaderboardEntry = {
	rank: number;
	walletAddress: string;
	totalEarned: number;
	roundsPlayed: number;
}


const Leaderboard = ()=>{
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
	useEffect(() => {
		const fetchLeaderboardData = async () => {
			try {
				const response = await FetchLeaderboardData();
				setEntries(response.data.data.leaderboard);
			} catch (error) {
				console.error("Failed to fetch leaderboard:", error);
			}
		}
		fetchLeaderboardData();
	}, []);



	return (
		<>
		
	    <div className=" flex justify-center min-h-max  select-none overflow-y-auto h-[calc(100vh-8rem)]">
			<div className="">
				<div className="py-5">
					<h3 className="text-lime-400 text-center tracking-widest text-sm font-bold py-5">LEADERBOARD</h3>
				</div>
				<div className="bg-[#0b1206]/80 rounded-xl">
					<ul className="divide-y divide-lime-900/40">
						{entries.map((e, i) => (
							<li key={i} className="flex items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<span className="text-gray-400 text-xs w-4">{e.rank}</span>
									<span className="text-gray-200 text-sm truncate max-w-[120px]">{e.walletAddress}</span>
								</div>
								<div className="text-right">
									<span className="text-lime-400 font-semibold tabular-nums text-sm">+{e.totalEarned.toFixed(4)}</span>
									<span className="text-gray-400 text-xs ml-1">MON</span>
								</div>
							</li>
						))}
					</ul>
				</div>
				
			</div>
		</div>
						</>
	)
}

export default Leaderboard;
