"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../store/useGame";
import { useAccount } from "wagmi";
import { getSessionState, getLastSessionId, RestoreSession } from "@/app/services/api";
import deathtile from "../../public/death-skull.svg";
import { getDeathTileIndex, generateServerSeed } from "@/app/utils/crypto";


type BoardRow = {
	multiplier: number
	tiles: number
}

const TileBoard = ()=>{
	const [rows, setRows] = useState<BoardRow[]>([]);
	const { isPlaying, selectTile, endRound, sessionId, rehydrate, setSessionId, Replay, setReplay, shuffleBoard, setShuffleBoard, serverSeed, initialStake, cumulativePayoutAmount, setCumulativePayoutAmount } = useGame();
	const { address: walletAddress } = useAccount();
	const [activeRow, setActiveRow] = useState(0);
	const [clickedByRow, setClickedByRow] = useState<Record<number, boolean>>({});
	const [clickedTileIndex, setClickedTileIndex] = useState<Record<number, number>>({}); // row -> clicked tile index
	const [deathTiles, setDeathTiles] = useState<Record<number, number>>({}); // row -> death tile index
	const skipNextStartResetRef = useRef(false);
	const fetchedLastSessionRef = useRef(false);
	const [spinner, setSpinner] = useState(false);
	const isProcessingClickRef = useRef(false);
	const tileboardRef = useRef<HTMLDivElement>(null);



	const LoadingSpinner = () => (
		<div className="flex items-center justify-center h-full min-h-[500px]">
		  <svg className="animate-spin h-10 w-10 text-lime-400" fill="none" viewBox="0 0 24 24">
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
			<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		  </svg>
		  <span className="ml-4 text-lime-400 text-xl">Loading Board...</span>
		</div>
	  );
	
	// Auto-scroll to active row
	const scrollToActiveRow = () => {
		if (tileboardRef.current && isPlaying) {
			const rowElements = tileboardRef.current.querySelectorAll('[data-row-index]');
			const activeRowElement = Array.from(rowElements).find(el => 
				parseInt(el.getAttribute('data-row-index') || '0') === activeRow
			);
			
			if (activeRowElement) {
				activeRowElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
					inline: 'nearest'
				});
			}
		}
	};

	// const LoadingSpinner = ({ message = "Loading..." }) => (
	// 	<div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	// 	  <div className="flex flex-col items-center gap-4">
	// 		<div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
	// 		<p className="text-emerald-400 text-lg font-semibold">{message}</p>
	// 	  </div>
	// 	</div>
	//   );


	

    function formatMultiplier(mult: number): string {
	   return `${mult.toFixed(2)}x`
    }

	const visualRows = useMemo(() => [...rows].reverse(), [rows]);

	useEffect(() => {
		// Generate board from Redis session data if available, otherwise fallback to random
		const generateBoardRows = async () => {
			try {
				if (sessionId) {
					// Try to get session data from Redis
					const sessionData = await RestoreSession(sessionId);
					if (sessionData.success && sessionData.session?.rows) {
						// Use board layout from Redis
						const startMultiplier = 1.10;
						const growthPerRow = 1.18;
						
						const generated: BoardRow[] = sessionData.session.rows.map((tiles: number, i: number) => ({
							tiles,
							multiplier: startMultiplier * Math.pow(growthPerRow, i)
						}));
						
						setRows(generated);
						setClickedByRow({});
						setClickedTileIndex({});
						setDeathTiles({});
						return;
					}
				}
				
				// Fallback to random generation
				const numRows = 12 + Math.floor(Math.random() * 4); // 12..15
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
			} catch (error) {
				console.error('Failed to generate board:', error);
				// Fallback to simple random generation
				const numRows = 12 + Math.floor(Math.random() * 4);
				const startMultiplier = 1.10;
				const growthPerRow = 1.18;
				const generated: BoardRow[] = [];
				
				for (let i = 0; i < numRows; i++) {
					const tiles = 2 + Math.floor(Math.random() * 6);
					const multiplier = startMultiplier * Math.pow(growthPerRow, i);
					generated.push({ multiplier, tiles });
				}
				
				setRows(generated);
				setClickedByRow({});
				setClickedTileIndex({});
				setDeathTiles({});
			}
		};
		
		generateBoardRows();
	}, [sessionId]);

	useEffect(() => {
		// reset progression on start
		if (!isPlaying) return;
		if (skipNextStartResetRef.current) { skipNextStartResetRef.current = false; return; }
		setClickedByRow({})
		setClickedTileIndex({})
		setDeathTiles({})
		setActiveRow(Math.max(visualRows.length - 1, 0))
	}, [isPlaying, visualRows.length]);

	// If sessionId is empty on reload, fetch the last session for this wallet
	useEffect(() => {
		if (sessionId || !walletAddress || fetchedLastSessionRef.current) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await getLastSessionId(walletAddress);
				if (cancelled) return;
				const last = res?.sessionId ?? res?.lastSessionId ?? null;
				if (last) {
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
		if (!sessionId || rows.length === 0) return;

		setSpinner(true);
		let cancelled = false;
		(async () => {
			try {
				const ts = Date.now();
				const sessionState = await getSessionState(sessionId);
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


	// Death tile calculation now uses the deterministic function from crypto utils

	const handleTileClick = async (visualIdx: number, clickedTileIdx: number)=>{
		if(!walletAddress || !isPlaying) return;
		if (visualIdx !== activeRow || clickedByRow[visualIdx]) return; // only current row once
		
		// Prevent multiple simultaneous clicks
		if (isProcessingClickRef.current) return;
		
		isProcessingClickRef.current = true;

		// Ensure session exists if user skipped Play
		if (!sessionId) {
			const id = crypto.randomUUID();
			setSessionId(id);
		}
		

		// Map visual index back to original rows index
		const actualIdx = rows.length - 1 - visualIdx;
		const tiles = rows[actualIdx]?.tiles ?? 0
		
		// Use serverSeed for death tile calculation
		const deathIdx = await getDeathTileIndex(serverSeed || "local-seed", actualIdx, tiles);
		const isDeath = clickedTileIdx === deathIdx
		// setIsSession(true);
		

		// Mark the tile as clicked and show the result
		setClickedByRow(prev => ({ ...prev, [visualIdx]: true }))
		setClickedTileIndex(prev => ({ ...prev, [visualIdx]: clickedTileIdx }))
		
		// Store the death tile index for this row
		setDeathTiles(prev => ({ ...prev, [visualIdx]: deathIdx }))
		
		const rowMult = rows[actualIdx]?.multiplier ?? 1;
		
		if(isDeath){
			// End round immediately for death tile
			endRound();
			// Reset earnings immediately
			setCumulativePayoutAmount(0);
			// Cache the death tile asynchronously
			selectTile(actualIdx, clickedTileIdx, walletAddress, isDeath, rowMult);
			isProcessingClickRef.current = false;
			return;
		}
		
		await selectTile(actualIdx, clickedTileIdx, walletAddress, isDeath, rowMult);
		// move downward or finish at the bottom row
		if (activeRow <= 0) {
			endRound();
			// setIsSession(false);
			// setReplay(true);
			isProcessingClickRef.current = false;
		} else {
			// Move to next row after showing the result
			setTimeout(() => {
				setActiveRow(prev => prev - 1)
				isProcessingClickRef.current = false;
			}, 300);
		}
	}



	const regenerateBoard = async () => {
		setSpinner(true);
		
		try {
			// Generate new board using Redis session data if available
			if (sessionId) {
				const sessionData = await RestoreSession(sessionId);
				if (sessionData.success && sessionData.session?.rows) {
					const startMultiplier = 1.10;
					const growthPerRow = 1.18;
					
					const generated: BoardRow[] = sessionData.session.rows.map((tiles: number, i: number) => ({
						tiles,
						multiplier: startMultiplier * Math.pow(growthPerRow, i)
					}));
					
					setRows(generated);
					setClickedByRow({});
					setClickedTileIndex({});
					setDeathTiles({});
					setActiveRow(Math.max(generated.length - 1, 0));
					setSpinner(false);
					return;
				}
			}
			
			// Fallback to random generation
			const numRows = 12 + Math.floor(Math.random() * 4);
			const startMultiplier = 1.10;
			const growthPerRow = 1.18;
			const generated: BoardRow[] = [];
			
			for (let i = 0; i < numRows; i++) {
				const tiles = 2 + Math.floor(Math.random() * 6);
				const multiplier = startMultiplier * Math.pow(growthPerRow, i);
				generated.push({ multiplier, tiles });
			}
			
			setRows(generated);
			setClickedByRow({});
			setClickedTileIndex({});
			setDeathTiles({});
			setActiveRow(Math.max(generated.length - 1, 0));
		} catch (error) {
			console.error('Failed to regenerate board:', error);
			// Fallback to simple random generation
			const numRows = 12 + Math.floor(Math.random() * 4);
			const startMultiplier = 1.10;
			const growthPerRow = 1.18;
			const generated: BoardRow[] = [];
			
			for (let i = 0; i < numRows; i++) {
				const tiles = 2 + Math.floor(Math.random() * 6);
				const multiplier = startMultiplier * Math.pow(growthPerRow, i);
				generated.push({ multiplier, tiles });
			}
			
			setRows(generated);
			setClickedByRow({});
			setClickedTileIndex({});
			setDeathTiles({});
			setActiveRow(Math.max(generated.length - 1, 0));
		}
		
		setSpinner(false);
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

	// Auto-scroll when active row changes
	useEffect(() => {
		if (isPlaying && activeRow >= 0) {
			// Small delay to ensure DOM is updated
			setTimeout(() => {
				scrollToActiveRow();
			}, 100);
		}
	}, [activeRow, isPlaying]);

	return(
		
		<>
		
{
		spinner ? (
			<LoadingSpinner />
		) : (
<div className="px-4 py-10 ">
	      <div ref={tileboardRef} className="flex flex-col gap-4">
		{visualRows.map((row, vIdx) => (
			<div key={vIdx} data-row-index={vIdx} className="flex items-center gap-4 justify-center">
				<div className="text-gray-300 font-semibold tabular-nums select-none w-16 text-right">
					{formatMultiplier(row.multiplier)}
				</div>

				<div className={`flex items-center gap-3 rounded-2xl px-8 md:px-10 py-7 bg-[#0f172a]/90 border min-w-[700px] ${isPlaying && vIdx === activeRow ? 'border-emerald-500' : 'border-gray-800/60'}`}>
					<div className="flex items-center gap-3 justify-center w-full">
						{Array.from({ length: row.tiles }).map((_, idx) => {
							const actualTileIdx = idx; // Tile index for game logic
							const isVisible = true;
							
							const isDeathTile = deathTiles[vIdx] === actualTileIdx;
							const isClicked = clickedByRow[vIdx];
							const clickedTileIdx = clickedTileIndex[vIdx];
							
							// Determine tile color based on state
							let tileColor = "bg-gray-700 border-gray-700/60 hover:bg-white/10 cursor-pointer transition duration-300";
							if (isClicked && clickedTileIdx === actualTileIdx) {
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
										onClick={() => handleTileClick(vIdx, actualTileIdx)}
										className={`h-20 w-20 rounded-md transition-colors border ${tileColor} ${(!isPlaying || vIdx !== activeRow || clickedByRow[vIdx]) ? 'opacity-60 cursor-not-allowed hover:bg-gray-700' : 'hover:bg-gray-500'}`}
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


