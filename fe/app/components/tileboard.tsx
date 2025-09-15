"use client"

import { useEffect, useState } from "react"

type BoardRow = {
	multiplier: number
	activeIndices: number[] // unique tile indices 0..6 (unused for now)
	tiles: number // number of visible tiles on this board (0..7)
}

function pickUniqueIndices(count: number, maxExclusive: number): number[] {
	const indices: number[] = []
	while (indices.length < count) {
		const r = Math.floor(Math.random() * maxExclusive)
		if (!indices.includes(r)) indices.push(r)
	}
	return indices.sort((a,b) => a - b)
}

function createRandomRow(): BoardRow {
	const multiplier = 1 + Math.random() * 3 // 1.00x - 4.00x
	const tileCount = Math.max(1, Math.floor(Math.random() * 5)) // 1..4
	const activeIndices = pickUniqueIndices(tileCount, 7)
	return { multiplier, activeIndices, tiles: 7 }
}

const INITIAL_ROWS = Array.from({ length: 7 }).map(() => createRandomRow())

function formatMultiplier(mult: number): string {
	return `${mult.toFixed(2)}x`
}

const TileBoard = ()=>{
	const [rows, setRows] = useState<BoardRow[]>([])

	useEffect(() => {
		// Generate 12–15 boards; each with 0–7 active tiles across 7 positions
		const numRows = 12 + Math.floor(Math.random() * 4) // 12..15
		const startMultiplier = 1.10
		const growthPerRow = 1.18
		const generated: BoardRow[] = []
		for (let i = 0; i < numRows; i++) {
			const tiles = 2 + Math.floor(Math.random() * 6) // 2..7 visible tiles
			const activeIndices: number[] = []
			const multiplier = startMultiplier * Math.pow(growthPerRow, i)
			generated.push({ multiplier, activeIndices, tiles })
		}
		setRows(generated)
	}, [])

	return(
		<>
		<div className="px-4 py-10 mb-40">
	<div className="flex flex-col gap-4">
		{[...rows].reverse().map((row, rowIndex) => (
			<div key={rowIndex} className="flex items-center gap-4 justify-center">
				<div className="text-gray-300 font-semibold tabular-nums select-none w-16 text-right">
					{formatMultiplier(row.multiplier)}
				</div>

				<div className={`flex items-center gap-4 rounded-2xl px-8 md:px-10 py-8 bg-[#0f172a]/90 border border-gray-800`}>
					<div className="flex flex-row-reverse items-center gap-4 justify-end">
						{Array.from({ length: row.tiles }).map((_, idx) => (
							<div
								key={idx}
								className={`h-18 w-15 cursor-pointer rounded-md transition-colors bg-[#121a29] hover:bg-gray-700 border border-gray-700/60`}
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


