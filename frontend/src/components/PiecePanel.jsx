import { AnimatePresence, motion } from 'motion/react'
import { getPlayerColorHex } from '../playerColors'
import Piece from './Piece'

function PiecePanel({
	canMove,
	isWaitingForPlayers,
	onPieceClick,
	pieces,
	playablePieceNames,
	player,
	selectedPieceName,
	totalPieceCount,
}) {
	const playerColor = getPlayerColorHex(player?.color)

	return (
		<div className="piecesRight">
			<div className="piecePanelHeader">
				<div className="currentPlayerDetails">
					<div className="panelPlayerName">
						<span
							className="panelPlayerColor"
							style={{ background: playerColor }}
						/>

						{player?.name || 'Joining...'}
					</div>
				</div>

				<div className="placementHint">
					<span className="hintPieceIcon" />

					<span>
						Click a piece to
						<br />
						see where it fits
					</span>
				</div>
			</div>

			<div data-game-piece className="pieceCardGrid">
				<AnimatePresence mode="popLayout" initial={false}>
					{pieces.map(piece => {
						const isPlayable = playablePieceNames.has(piece.name)

						return (
							<motion.div
								key={piece.name}
								layout
								className="pieceGridItem"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.82 }}
								transition={{ duration: 0.22, ease: 'easeOut' }}
							>
								<Piece
									piece={piece}
									isWaitingForPlayers={isWaitingForPlayers}
									placed={piece.placed}
									color={player?.color}
									isSelected={isPlayable && selectedPieceName === piece.name}
									isPlayable={isPlayable}
									disabled={!canMove}
									onClick={event => onPieceClick(piece, event)}
									rotation={piece.rotation}
									flipped={piece.flipped}
									displaySize={86}
									cellSize={18}
									bare
								/>
							</motion.div>
						)
					})}
				</AnimatePresence>
			</div>

			<div className="piecesRemaining">
				<div>
					Pieces remaining: <strong>{pieces.length}</strong>
				</div>

				<div className="remainingDots" aria-hidden="true">
					{Array.from({ length: totalPieceCount }).map((_, index) => (
						<span
							key={index}
							className={index < pieces.length ? 'unused' : 'used'}
							style={{ '--piece-color': playerColor }}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

export default PiecePanel
