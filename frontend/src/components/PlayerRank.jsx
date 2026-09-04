import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import clsx from 'clsx'
import { getPlayerColorHex } from '../playerColors'
import Piece from './Piece'

function placedBlockCount(player) {
	return (player?.pieces || []).reduce(
		(total, piece) => total + (piece.placed ? piece.cells.length : 0),
		0,
	)
}

function totalBlockCount(player) {
	return (player?.pieces || []).reduce(
		(total, piece) => total + piece.cells.length,
		0,
	)
}

function PlayerRank({ currentUserId, game }) {
	const [expandedPlayerId, setExpandedPlayerId] = useState(null)
	const isWaitingForPlayers = game?.status === 'waiting'

	const playerProgress = useMemo(() => {
		const knownTotalBlocks = totalBlockCount(game?.players[0])

		return Object.keys(game?.settings?.players || {})
			.map((playerKey, originalIndex) => {
				const player = game?.players.find(
					joinedPlayer => joinedPlayer.settingsPlayerKey === playerKey,
				)

				return {
					name: player?.color || playerKey,
					color: getPlayerColorHex(player?.color),
					player,
					placedBlocks: placedBlockCount(player),
					totalBlocks: player ? totalBlockCount(player) : knownTotalBlocks,
					originalIndex,
				}
			})
			.sort((first, second) =>
				second.placedBlocks - first.placedBlocks ||
				first.originalIndex - second.originalIndex
			)
	}, [game])

	const handleTogglePieces = playerId => {
		if (isWaitingForPlayers) return

		setExpandedPlayerId(currentId => currentId === playerId ? null : playerId)
	}

	return (
		<div className="playerRankPanel">
			<LayoutGroup id="player-rankings">
				<div className="playerPanelGrid">
					{playerProgress.map(progress => {
						const isActiveTurn = progress.player?.id === game.currentPlayerId
						const isExpanded = progress.player?.id === expandedPlayerId
						const canViewPieces = Boolean(
							progress.player && progress.player.id !== currentUserId,
						)
						const remainingPieces = progress.player?.pieces.filter(
							piece => !piece.placed,
						) || []

						return (
							<motion.div
								key={progress.name}
								layout="position"
								className={clsx('playerStatusCard', {
									playerStatusActive: isActiveTurn,
									playerStatusEmpty: !progress.player,
								})}
								style={{ '--player-color': progress.color }}
								transition={{
									layout: {
										type: 'spring',
										stiffness: 220,
										damping: 28,
										mass: 0.8,
									},
								}}
							>
								<div className="playerStatusHeader">
									<div className="playerStatusName">
										<span className="playerStatusColor" />
										{progress.player?.name || progress.name}
									</div>
								</div>

								<div className="playerStatusBody">
									<div>
										<div className="playerStatusBlocks">
											{progress.placedBlocks}
										</div>

										<div className="playerStatusCaption">
											blocks placed
										</div>
									</div>

									{canViewPieces && (
										<button
											type="button"
											className="viewPiecesButton"
											aria-expanded={isExpanded}
											onClick={() => handleTogglePieces(progress.player.id)}
										>
											{isExpanded ? 'Hide Pieces' : 'View Pieces'}
										</button>
									)}
								</div>

								<AnimatePresence initial={false}>
									{isExpanded && (
										<motion.div
											className={clsx(
												'playerRemainingPieces',
												remainingPieces.length > 15 && 'playerRemainingPiecesScrollable',
											)}
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: 'auto', opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.28, ease: 'easeOut' }}
										>
											{remainingPieces.map(piece => (
												<Piece
													key={piece.name}
													piece={piece}
													isWaitingForPlayers
													placed={false}
													isSelected={false}
													rotation={0}
													flipped={false}
													color={progress.color}
													displaySize={80}
												/>
											))}
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						)
					})}
				</div>
			</LayoutGroup>
		</div>
	)
}

export default PlayerRank
