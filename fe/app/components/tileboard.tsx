"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../store/useGame";
import { useAccount } from "wagmi";
import { getSessionState, getLastSessionId } from "@/app/services/api";
import deathtile from "../../public/death-skull.svg";



type BoardRow = {
	multiplier: number
	tiles: number // number of visible tiles on this board (0..7)
}

const TileBoard = ()=>{
	const [rows, setRows] = useState<BoardRow[]>([]);
	const { isPlaying, selectTile, endRound, sessionId, rehydrate, setSessionId, Replay, setReplay, shuffleBoard, setShuffleBoard } = useGame();
	const { address: walletAddress } = useAccount();
	const [activeRow, setActiveRow] = useState(0);
	const [clickedByRow, setClickedByRow] = useState<Record<number, boolean>>({});
	const [clickedTileIndex, setClickedTileIndex] = useState<Record<number, number>>({}); // row -> clicked tile index
	const [deathTiles, setDeathTiles] = useState<Record<number, number>>({}); // row -> death tile index
	// const [isSession, setIsSession] = useState(false);
	const skipNextStartResetRef = useRef(false);
	const fetchedLastSessionRef = useRef(false);
	const [spinner, setSpinner] = useState(false);
	

	const LoadingSpinner = ({ message = "Loading..." }) => (
		<div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		  <div className="flex flex-col items-center gap-4">
			<div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
			<p className="text-emerald-400 text-lg font-semibold">{message}</p>
		  </div>
		</div>
	  );


	

    function formatMultiplier(mult: number): string {
	   return `${mult.toFixed(2)}x`
    }

	const visualRows = useMemo(() => [...rows].reverse(), [rows]);

	useEffect(() => {
		// Generate 12–15 boards; each with 0–7 active tiles across 7 positions
		const numRows = 12 + Math.floor(Math.random() * 4) // 12..15
		const startMultiplier = 1.10
		const growthPerRow = 1.18
		const generated: BoardRow[] = []
		for (let i = 0; i < numRows; i++) {
			const tiles = 2 + Math.floor(Math.random() * 6) // 2..7 visible tiles
			const multiplier = startMultiplier * Math.pow(growthPerRow, i)
			generated.push({ multiplier, tiles })
		}
		setRows(generated)
		setClickedByRow({})
		setClickedTileIndex({})
		setDeathTiles({})
	}, []);

	useEffect(() => {
		// reset progression on start: start from the top (reverse side)
		if (!isPlaying) return;
		if (skipNextStartResetRef.current) { skipNextStartResetRef.current = false; return; }
		setClickedByRow({})
		setClickedTileIndex({})
		setDeathTiles({})
		setActiveRow(Math.max(visualRows.length - 1, 0))
	}, [isPlaying, visualRows.length]);

	// If sessionId is empty on reload, fetch the last session for this wallet and set it
	useEffect(() => {
		if (sessionId || !walletAddress || fetchedLastSessionRef.current) return;
		let cancelled = false;
		(async () => {
			try {
				console.log("[SESSION] fetch last ->", walletAddress);
				const res = await getLastSessionId(walletAddress);
				if (cancelled) return;
				const last = res?.sessionId ?? res?.lastSessionId ?? null;
				if (last) {
					console.log("[SESSION] apply last ->", last);
					setSessionId(last);
					fetchedLastSessionRef.current = true;
				}
			} catch (e) {
				console.error("[SESSION] getLastSessionId failed", e);
			}
		})();
		return () => { cancelled = true };
	}, [sessionId, walletAddress, setSessionId]);

	// Rehydrate from backend cache on mount/when session and rows are ready (no localStorage)
	useEffect(() => {
		console.log("[SESSION] rehydrate mount ->", { sessionId, rowsLen: rows.length });
		if (!sessionId || rows.length === 0) return;

		// setSpinner(true);
		let cancelled = false;
		(async () => {
			try {
				const ts = Date.now();
				console.log("[rehydrate] GET", `${process.env.NEXT_PUBLIC_BE_URL || "http://localhost:8001"}/api/cache/check-cache/${sessionId}?t=${ts}`);
				const sessionState = await getSessionState(sessionId);
				console.log("[rehydrate] res", sessionState);
				if (cancelled) return;

				// Restore playing flag from server first
				if (sessionState && sessionState.isPlaying) {
					skipNextStartResetRef.current = true;
					rehydrate({ isPlaying: true, roundEnded: false });
				}

				if (sessionState.roundEnded || !sessionState.isPlaying) {
					setSpinner(false);
					return;
				}

				const lastClickedRow = sessionState.lastClicked ?? sessionState.lastClickedRow;
				if (lastClickedRow !== null && lastClickedRow !== undefined) {
					// Restore to next row after last clicked
					const nextRow = parseInt(lastClickedRow) + 1;
					if (nextRow < rows.length) {
						const visualIdx = rows.length - 1 - nextRow;
						setActiveRow(visualIdx);
						skipNextStartResetRef.current = true;
						rehydrate({ isPlaying: true, roundEnded: false, rowIndex: nextRow });
					}	
				}
				setSpinner(false); // Hide spinner on successful rehydration
			} catch (e) {
				console.error("[REHYDRATE] failed", e);
				setSpinner(false);
			}
		})();
		return () => { cancelled = true };
	}, [sessionId, rows.length, rehydrate]);


	// Maintain game state using : 
	

	async function sha256Hex(input: string) {
		const data = new TextEncoder().encode(input)
		const hash = await crypto.subtle.digest("SHA-256", data)
		return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
	}

	async function getDeathTileIndex(seed: string, rowIdx: number, tiles: number) {
		const h = await sha256Hex(`${seed}-row${rowIdx}`)
		// use a different slice and rotate by +1 to avoid index 0 too often
		const n = parseInt(h.slice(8, 16), 16)
		return tiles > 0 ? ((n % tiles) + 1) % tiles : 0
	}

	const handleTileClick = async (visualIdx: number, clickedTileIdx: number)=>{
		console.log("[SESSION] click ->", { sessionId, visualIdx, activeRow });
		if(!walletAddress || !isPlaying) return;
		if (visualIdx !== activeRow || clickedByRow[visualIdx]) return; // only current row once

		// Ensure session exists if user somehow skipped Play
		if (!sessionId) {
			const id = crypto.randomUUID();
			console.log("[SESSION] fallback create on click ->", id);
			setSessionId(id);
		}
		

		// Map visual index back to actual index in original rows array
		const actualIdx = rows.length - 1 - visualIdx;
		const tiles = rows[actualIdx]?.tiles ?? 0
		const deathIdx = await getDeathTileIndex(sessionId || "local-seed", actualIdx, tiles)
		const isDeath = clickedTileIdx === deathIdx
		// setIsSession(true);
		

		const rowMult = rows[actualIdx]?.multiplier ?? 1;
        await selectTile(actualIdx, clickedTileIdx, walletAddress, isDeath, rowMult);
		// await selectTile(actualIdx, clickedTileIdx, walletAddress, isDeath);
		setClickedByRow(prev => ({ ...prev, [visualIdx]: true }))
		setClickedTileIndex(prev => ({ ...prev, [visualIdx]: clickedTileIdx }))
		
		// Store the death tile index for this row
		setDeathTiles(prev => ({ ...prev, [visualIdx]: deathIdx }))
		
		if(isDeath){
			console.log(`[DEATH] row=${actualIdx} deathIdx=${deathIdx} clicked=${clickedTileIdx}`)
			// setReplay(true);
			
			// toast.error("Death tile hit. Round ended.");
			endRound();
			// setIsSession(false);
			return;
		}
		// move downward (reverse direction) or finish at the bottom row
		if (activeRow <= 0) {
			endRound();
			// setIsSession(false);
			// setReplay(true);
			
		} else {
			setActiveRow(prev => prev - 1)
		
		}
	}



	const regenerateBoard = () => {
		setSpinner(true);
		
		setTimeout(() => {
			// Generate new board
			const numRows = 12 + Math.floor(Math.random() * 4);
			const startMultiplier = 1.10;
			const growthPerRow = 1.18;
			const generated: BoardRow[] = [];
			
			for (let i = 0; i < numRows; i++) {
				const tiles = 2 + Math.floor(Math.random() * 6); // 2..7 visible tiles
				const multiplier = startMultiplier * Math.pow(growthPerRow, i);
				generated.push({ multiplier, tiles });
			}
			
			setRows(generated);
			setClickedByRow({});
			setClickedTileIndex({});
			setDeathTiles({});
			setActiveRow(Math.max(generated.length - 1, 0));
			setSpinner(false);
		}, 100); // Simulate loading time
	};


// Shuffle on Replay or any fresh start
	useEffect(()=>{
		if(Replay){
			// Generate new sessionId for fresh death tiles
			const newSessionId = crypto.randomUUID();
			setSessionId(newSessionId);
			
			// Regenerate board with new layout
			regenerateBoard();
			
			// Reset replay flag
			setReplay(false);
		}
	}, [Replay, setSessionId, setReplay]);

	// Shuffle board for any fresh start (Start Game, Play Demo, Replay)
	useEffect(() => {
		if(shuffleBoard) {
			// Generate new sessionId for fresh death tiles
			const newSessionId = crypto.randomUUID();
			setSessionId(newSessionId);
			
			// Regenerate board with new layout
			regenerateBoard();
			
			// Reset shuffle flag
			setShuffleBoard(false);
		}
	}, [shuffleBoard, setSessionId, setShuffleBoard]);


	return(
		
		<>

{
		spinner ? (
			<LoadingSpinner message="Loading Game State..." />
		) : (
<div className="px-4 py-10 mb-40">
	      <div className="flex flex-col gap-4">
		{visualRows.map((row, vIdx) => (
			<div key={vIdx} className="flex items-center gap-4 justify-center">
				<div className="text-gray-300 font-semibold tabular-nums select-none w-16 text-right">
					{formatMultiplier(row.multiplier)}
				</div>

				<div className={`flex items-center gap-4 rounded-2xl px-8 md:px-10 py-8 bg-[#0f172a]/90 border ${isPlaying && vIdx === activeRow ? 'border-emerald-500' : 'border-gray-800/60'}`}>
					<div className="flex flex-row-reverse items-center gap-4 justify-end">
						{Array.from({ length: row.tiles }).map((_, idx) => {
							const isDeathTile = deathTiles[vIdx] === idx;
							const isClicked = clickedByRow[vIdx];
							const clickedTileIdx = clickedTileIndex[vIdx];
							
							// Determine tile color based on state
							let tileColor = "bg-[#121a29] border-gray-700/60";
							if (isClicked && clickedTileIdx === idx) {
								if (isDeathTile) {
									tileColor = "bg-red-600 border-red-500"; // Red for death tile
								} else {
									tileColor = "bg-green-500 border-green-500"; // Green for clicked safe tile
								}
							}
							
							return (
								<div key={idx} className="relative">
									<button
										type="button"
										disabled={!isPlaying || vIdx !== activeRow || !!clickedByRow[vIdx]}
										onClick={() => handleTileClick(vIdx, idx)}
										className={`h-20 w-20 rounded-md transition-colors border ${tileColor} ${(!isPlaying || vIdx !== activeRow || clickedByRow[vIdx]) ? 'opacity-60 cursor-not-allowed hover:bg-[#121a29]' : 'hover:bg-gray-700'}`}
									/>
									{/* Show death tile image on top of the death tile */}
									{isDeathTile && isClicked && (
										<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
											<img 
												src={deathtile.src} 
												alt="Death tile" 
												className="w-16 h-16 rounded-full object-contain"
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		))}
	</div>
</div>
		)
	}
		
		
		</>
	)
}
export default TileBoard;


