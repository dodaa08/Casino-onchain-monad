type Entry = { address: string; earnedEth: number }

type LeaderboardProps = {
	entries?: Entry[]
}

const defaultEntries: Entry[] = [
	{ address: "0xSauceBauce...", earnedEth: 7.1035 },
	{ address: "0xhoco......", earnedEth: 6.3008 },
	{ address: "0xzelph....", earnedEth: 2.9653 },
	{ address: "0xcole.....", earnedEth: 2.7719 },
]

const Leaderboard = ({ entries = defaultEntries }: LeaderboardProps)=>{
	return (
		<div className="w-72 h-screen ml-auto select-none">
			<div className="h-full border-l border-lime-900 pl-5 flex flex-col">
				<div className="mb-2 pt-6">
					<h3 className="text-lime-400 text-center tracking-widest text-xs font-bold py-5">LEADERBOARD</h3>
				</div>
				<div className="bg-[#0b1206]/80 rounded-xl">
					<ul className="divide-y divide-lime-900/40">
						{entries.slice(0, 4).map((e, i) => (
							<li key={i} className="flex items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<span className="text-gray-400 text-xs w-4">{i + 1}</span>
									<span className="text-gray-200 text-sm truncate max-w-[120px]">{e.address}</span>
								</div>
								<div className="text-right">
									<span className="text-lime-400 font-semibold tabular-nums text-sm">+{e.earnedEth.toFixed(4)}</span>
									<span className="text-gray-400 text-xs ml-1">ETH</span>
								</div>
							</li>
						))}
					</ul>
				</div>
				<div className="flex-1" />
			</div>
		</div>
	)
}

export default Leaderboard;
