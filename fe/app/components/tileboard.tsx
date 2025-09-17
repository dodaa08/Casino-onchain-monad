"use client"

import { useEffect, useMemo, useState } from "react";
import { useGame } from "../store/useGame";
import { useAccount } from "wagmi";

type BoardRow = {
	multiplier: number
	tiles: number // number of visible tiles on this board (0..7)
}

const TileBoard = ()=>{
	const [rows, setRows] = useState<BoardRow[]>([]);
	const { isPlaying, selectTile, endRound, sessionId } = useGame();
	const { address: walletAddress } = useAccount();
	const [activeRow, setActiveRow] = useState(0);
	const [clickedByRow, setClickedByRow] = useState<Record<number, boolean>>({});

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
	}, [])

	useEffect(() => {
		// reset progression on start: start from the top (reverse side)
		if (!isPlaying) return;
		setClickedByRow({})
		setActiveRow(Math.max(visualRows.length - 1, 0))
	}, [isPlaying, visualRows.length])

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
		if(!walletAddress || !isPlaying) return;
		if (visualIdx !== activeRow || clickedByRow[visualIdx]) return; // only current row once

		// Map visual index back to actual index in original rows array
		const actualIdx = rows.length - 1 - visualIdx;
		const tiles = rows[actualIdx]?.tiles ?? 0
		const deathIdx = await getDeathTileIndex(sessionId || "local-seed", actualIdx, tiles)
		const isDeath = clickedTileIdx === deathIdx

		await selectTile(actualIdx, clickedTileIdx, walletAddress, isDeath);
		setClickedByRow(prev => ({ ...prev, [visualIdx]: true }))
		if(isDeath){
			console.log(`[DEATH] row=${actualIdx} deathIdx=${deathIdx} clicked=${clickedTileIdx}`)
			alert("Death tile hit. Round ended.");
			endRound();
			return;
		}
		// move downward (reverse direction) or finish at the bottom row
		if (activeRow <= 0) {
			endRound();
		} else {
			setActiveRow(prev => prev - 1)
		}
	}

	return(
		<>
		<div className="px-4 py-10 mb-40">
	      <div className="flex flex-col gap-4">
		{visualRows.map((row, vIdx) => (
			<div key={vIdx} className="flex items-center gap-4 justify-center">
				<div className="text-gray-300 font-semibold tabular-nums select-none w-16 text-right">
					{formatMultiplier(row.multiplier)}
				</div>

				<div className={`flex items-center gap-4 rounded-2xl px-8 md:px-10 py-8 bg-[#0f172a]/90 border ${isPlaying && vIdx === activeRow ? 'border-emerald-500' : 'border-gray-800/60'}`}>
					<div className="flex flex-row-reverse items-center gap-4 justify-end">
						{Array.from({ length: row.tiles }).map((_, idx) => (
							<button
								key={idx}
								type="button"
								disabled={!isPlaying || vIdx !== activeRow || !!clickedByRow[vIdx]}
								onClick={() => handleTileClick(vIdx, idx)}
								className={`h-20 w-20 rounded-md transition-colors border bg-[#121a29] hover:bg-gray-700 border-gray-700/60 ${(!isPlaying || vIdx !== activeRow || clickedByRow[vIdx]) ? 'opacity-60 cursor-not-allowed hover:bg-[#121a29]' : ''}`}
							/>
						))}
					</div>
				</div>
			</div>
		))}
	</div>
</div>
		</>
	)
}
export default TileBoard;


