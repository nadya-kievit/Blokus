import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { PLAYER_COLOR_HEX, getPlayerColorHex } from '../playerColors'

function secondsUntil(timestamp) {
	return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000))
}

function TurnTimer({ endsAt }) {
	const [remainingSeconds, setRemainingSeconds] = useState(() => secondsUntil(endsAt))

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			const nextRemainingSeconds = secondsUntil(endsAt)

			setRemainingSeconds(currentSeconds =>
				currentSeconds === nextRemainingSeconds ? currentSeconds : nextRemainingSeconds
			)
		}, 250)

		return () => window.clearInterval(intervalId)
	}, [endsAt])

	return (
		<div className="turnTimer">
			{Math.floor(remainingSeconds / 60)}:
			{String(remainingSeconds % 60).padStart(2, '0')}
		</div>
	)
}

function PersonIcon() {
	return (
		<svg viewBox="0 0 24 24">
			<circle cx="12" cy="8" r="4" />
			<path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
		</svg>
	)
}

function RobotIcon() {
	return (
		<svg viewBox="0 0 24 24">
			<path d="M12 5V3" fill="none" />
			<circle cx="12" cy="2.25" r="1.25" stroke="none" />
			<rect x="5" y="6" width="14" height="13" rx="3" fill="none" />
			<path d="M5 10H4a2.5 2.5 0 0 0 0 5h1M19 10h1a2.5 2.5 0 0 1 0 5h-1" fill="none" />
			<circle cx="9" cy="11.5" r="1.3" stroke="none" />
			<circle cx="15" cy="11.5" r="1.3" stroke="none" />
			<path d="M9.5 16h5" fill="none" />
		</svg>
	)
}

function TrophyIcon() {
	return (
		<svg viewBox="0 0 24 24">
			<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" fill="none" />
			<path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v5M8 20h8M10 17h4" fill="none" />
		</svg>
	)
}

function TurnBanner({
	canMove,
	game,
	isRestarting,
	isTie,
	onRestart,
	resultColor,
	winner,
}) {
	const isFinished = game?.status === 'finished'
	const currentPlayer = game?.players.find(player => player.id === game.currentPlayerId)
	const turnPlayer = isFinished && !isTie ? winner : currentPlayer
	const isVisible = game?.status === 'playing' || isFinished
	const turnColor = isFinished
		? resultColor
		: getPlayerColorHex(currentPlayer?.color, PLAYER_COLOR_HEX.Yellow)

	return (
		<div className="turnBannerSlot">
			<AnimatePresence mode="wait" initial={false}>
				{isVisible && (
					<motion.div
						key={isFinished
							? `finished-${game?.winnerIds?.join('-') || game?.winnerId}`
							: game?.currentPlayerId}
						className={clsx('turnBanner', isFinished && 'finishedBanner')}
						style={{ '--turn-color': turnColor }}
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 4 }}
						transition={{ duration: 0.18, ease: 'easeOut' }}
					>
						<div className="turnAvatar" aria-hidden="true">
							{isFinished
								? <TrophyIcon />
								: turnPlayer?.isBot ? <RobotIcon /> : <PersonIcon />}
						</div>

						<div className="turnText">
							<div className="turnTitle">
								{isFinished
									? isTie ? 'It\'s a tie!' : `${winner?.name || 'A player'} won!`
									: canMove ? 'Your Turn!' : `${currentPlayer?.name}'s Turn`}
							</div>

							{game?.turnEndsAt != null && (
								<TurnTimer key={game.turnNumber} endsAt={game.turnEndsAt} />
							)}
						</div>

						{isFinished && (
							<button
								className="restartButton"
								onClick={onRestart}
								disabled={isRestarting}
							>
								<svg aria-hidden="true" viewBox="0 0 24 24">
									<path d="M3 12a9 9 0 1 0 3-6.7" />
									<path d="M3 4v5h5" />
								</svg>

								{isRestarting ? 'Starting...' : 'New Game'}
							</button>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default TurnBanner
