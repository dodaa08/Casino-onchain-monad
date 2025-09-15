"use client"


import { useEffect, useState } from "react"

type BoardRow = {
	multiplier: number
	activeIndices: number[] // unique tile indices 0..6
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
	return { multiplier, activeIndices }
}

const INITIAL_ROWS = Array.from({ length: 7 }).map(() => createRandomRow())

const TileBoard = ()=>{
	const [rows, setRows] = useState<BoardRow[]>(INITIAL_ROWS)

	useEffect(() => {
		// const id = setInterval(() => {
		// 	setRows(prev => {
		// 		const next = [createRandomRow(), ...prev]
		// 		return next.slice(0, 4)
		// 	})
		// }, 2000)
		// return () => clearInterval(id)
        setRows(prev => {
            const next = [createRandomRow(), ...prev]
            return next.slice(0, 4)
        })
	}, [])
	
	return(
		<>
		<div className="w-max flex justify-center items-center overflow-x-auto">
			<div className="flex flex-col gap-6 w-full max-w-5xl overflow-x-auto">
				{rows.map((row, rowIdx) => (
					<div key={rowIdx} className={`flex items-center gap-4 rounded-2xl px-6 py-3 bg-[#0f172a]/90 border ${rowIdx === 6 ? "border-lime-500/60 shadow-[0_0_0_2px_rgba(163,230,53,0.15)_inset]" : "border-[#1f2937]"}`}>
						<div className="text-gray-300 font-semibold tabular-nums select-none w-16 text-right">
							{row.multiplier.toFixed(2)}x
						</div>
						<div className="flex items-center gap-4 flex-1 justify-between">
							{Array.from({ length: 5 }).map((_, idx) => {
								const isActive = row.activeIndices.includes(idx)
								return (
									<div
										key={idx}
										className={`h-14 w-14 rounded-md transition-colors bg-[#1b2433]`}
									/>
								)
							})}
						</div>
					</div>
				))}
			</div>
		</div>
		</>
	)
}



export default TileBoard;