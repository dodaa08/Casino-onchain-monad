type BottomBarProps = {
	deposited?: number
	earned?: number
	onPlay?: () => void
	onDeposit?: () => void
}

const BottomBar = ({ deposited = 0, earned = 0, onPlay, onDeposit }: BottomBarProps)=>{
	return (
		<div className="fixed inset-x-0 bottom-6 flex justify-center px-4">
			<div className="w-full max-w-3xl bg-[#0b1206]/95 border border-green-900 rounded-2xl px-6 py-5 shadow-[0_0_0_1px_rgba(34,197,94,0.1)_inset]">
				<div className="flex items-center justify-center gap-6">
					<button onClick={onPlay} className="min-w-[180px] h-10 rounded-md bg-lime-400 text-black font-semibold tracking-wide hover:bg-lime-300 transition-colors">Play</button>
					<span className="text-gray-400">or</span>
					<button onClick={onDeposit} className="min-w-[180px] h-10 rounded-md bg-white text-black font-semibold tracking-wide hover:bg-gray-100 transition-colors">Deposit</button>
				</div>
				<div className="mt-4 flex items-center justify-center gap-6 text-sm">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Deposited</span>
						<span className="text-green-400 font-semibold tabular-nums">{deposited.toFixed(2)}x</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Earned</span>
						<span className="text-green-400 font-semibold tabular-nums">{earned.toFixed(2)}x</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default BottomBar;
