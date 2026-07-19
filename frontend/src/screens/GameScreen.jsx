import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { makeStyles } from 'tss-react/mui'
import clsx from 'clsx'
import {
	gameSocketUrl,
	getGame,
	quitGame,
	restartGame,
	validateMove,
} from '../services/api'
import gameStyles from '../gameStyles'
import Board from '../components/Board'
import Piece, { CursorPiece } from '../components/Piece'

const useStyles = makeStyles()(gameStyles)

const BOARD_SIZE = 20
const REQUIRED_PLAYERS = 4
const PLAYER_SEATS = [
	{ name: 'Red', color: '#e34242' },
	{ name: 'Blue', color: '#0077ee' },
	{ name: 'Green', color: '#28a745' },
	{ name: 'Yellow', color: '#f3b51b' },
]
const PLAYER_PANEL_ORDER = ['Green', 'Red', 'Blue', 'Yellow']
const PROGRESS_SEGMENTS = 18

const EMPTY_BOARD = Array(BOARD_SIZE).fill(null).map(() =>
	Array(BOARD_SIZE).fill(null).map(() => ({
		occupied: false,
		player: null,
		color: null,
	}))
)

function rotationForCells(cells, rotation) {
	return cells.map(([row, col]) => {
		switch (rotation) {
			case 90:
				return [-col, row]
			case 180:
				return [-row, -col]
			case 270:
				return [col, -row]
			default:
				return [row, col]
		}
	})
}

function viewToBoard(row, col, rotation, size) {
	switch (rotation) {
		case 90:
			return { row: size - 1 - col, col: row }
		case 180:
			return { row: size - 1 - row, col: size - 1 - col }
		case 270:
			return { row: col, col: size - 1 - row }
		default:
			return { row, col }
	}
}

function rotationForCorner(corner) {
	if (!corner) return 0

	if (corner.row === 0 && corner.col === 0) return 180
	if (corner.row === 0 && corner.col === BOARD_SIZE - 1) return 90
	if (corner.row === BOARD_SIZE - 1 && corner.col === 0) return 270

	return 0
}

function placedBlockCount(player) {
	return (player?.pieces || []).reduce(
		(total, piece) => total + (piece.placed ? piece.cells.length : 0),
		0
	)
}

function totalBlockCount(player) {
	return (player?.pieces || []).reduce((total, piece) => total + piece.cells.length, 0)
}

function GameScreen({ gameId, onLeaveGame, onNeedsColor }) {
	const { classes } = useStyles()

	const storageKey = `blokus-player-${gameId}`
	const socketRef = useRef(null)
	const lastHoverTargetRef = useRef(null)
	const cursorPieceRef = useRef(null)
	const cursorPositionRef = useRef({ x: 0, y: 0 })
	const cursorFrameRef = useRef(null)
	const validationSequenceRef = useRef(0)
	const hoverTimerRef = useRef(null)

	const [credentials] = useState(() => {
		const stored = localStorage.getItem(storageKey)
		return stored ? JSON.parse(stored) : null
	})

	const [game, setGame] = useState(null)
	const [pieceRotations, setPieceRotations] = useState({})
	const [selectedPieceName, setSelectedPieceName] = useState(null)
	const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
	const [hoverCells, setHoverCells] = useState([])
	const [connectionStatus, setConnectionStatus] = useState('joining')
	const [lastMessage, setLastMessage] = useState('')
	const [isQuitting, setIsQuitting] = useState(false)
	const [isRestarting, setIsRestarting] = useState(false)
	const [isWinnerModalClosed, setIsWinnerModalClosed] = useState(false)

	const me = useMemo(
		() => game?.players.find(player => player.id === credentials?.playerId),
		[game, credentials]
	)

	const currentPlayer = useMemo(
		() => game?.players.find(player => player.id === game.currentPlayerId),
		[game]
	)

	const pieces = useMemo(
		() => (me?.pieces || []).map(piece => ({
			...piece,
			rotation: pieceRotations[piece.name] || 0,
		})),
		[me, pieceRotations]
	)

	const selectedPiece = useMemo(
		() => pieces.find(piece => piece.name === selectedPieceName && !piece.placed) || null,
		[pieces, selectedPieceName]
	)

	const canMove =
		game?.status === 'playing' &&
		game.currentPlayerId === credentials?.playerId

	const board = game?.board || EMPTY_BOARD
	const isFinished = game?.status === 'finished'
	const boardRotation = rotationForCorner(me?.corner)
	const winner = useMemo(
		() => game?.players.find(player => player.id === game?.winnerId),
		[game]
	)
	const leaderboard = game?.leaderboard || []
	const joinedPlayerNames = useMemo(
		() => new Set((game?.players || []).map(player => player.name)),
		[game]
	)
	const readyCount = game?.players.length || 0
	const isWaitingForPlayers = game?.status === 'waiting'
	const playerProgress = useMemo(
		() => {
			const knownTotalBlocks = totalBlockCount(game?.players[0])

			return PLAYER_PANEL_ORDER.map(name => {
				const seat = PLAYER_SEATS.find(playerSeat => playerSeat.name === name)
				const player = game?.players.find(joinedPlayer => joinedPlayer.name === name)
				const placedBlocks = placedBlockCount(player)
				const totalBlocks = player ? totalBlockCount(player) : knownTotalBlocks

				return {
					name,
					color: seat?.color || player?.color || '#0077ee',
					player,
					placedBlocks,
					totalBlocks,
					progress: totalBlocks > 0 ? placedBlocks / totalBlocks : 0,
				}
			})
		},
		[game]
	)

	useEffect(() => {
		if (game && !credentials) {
			onNeedsColor()
		}
	}, [game, credentials, onNeedsColor])

	useEffect(() => {
		setIsWinnerModalClosed(false)
	}, [game?.winnerId])

	useEffect(() => {
		let isActive = true

		async function loadGame() {
			try {
				const initialGame = await getGame(gameId)

				if (isActive) {
					setGame(initialGame)
				}

				if (!credentials && isActive) {
					setConnectionStatus('choosing')
				}
			} catch (err) {
				if (isActive) {
					setLastMessage(err.message)
					setConnectionStatus('error')
				}
			}
		}

		loadGame()

		return () => {
			isActive = false
		}
	}, [gameId, credentials])

	useEffect(() => {
		if (!credentials) return

		const socket = new WebSocket(gameSocketUrl(gameId, credentials))
		socketRef.current = socket

		socket.onopen = () => {
			setConnectionStatus('connected')
			socket.send(JSON.stringify({ type: 'request_state' }))
		}

		socket.onmessage = event => {
			const message = JSON.parse(event.data)

			if (message.type === 'game_state') {
				setGame(message.game)

				if (message.game.notice) {
					setLastMessage(message.game.notice)
				}
			}

			if (message.type === 'error') {
				setLastMessage(message.reason)
			}
		}

		socket.onclose = () => {
			setConnectionStatus('disconnected')
		}

		return () => {
			socket.close()
		}
	}, [gameId, credentials])

	useEffect(() => {
		const handleKeyDown = event => {
			if (!selectedPieceName) return

			if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return

			setPieceRotations(prev => {
				const rotationChange = event.key === 'ArrowRight' ? 90 : -90
				const currentRotation = prev[selectedPieceName] || 0

				return {
					...prev,
					[selectedPieceName]: (currentRotation + rotationChange + 360) % 360,
				}
			})
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [selectedPieceName])

	useEffect(() => {
		if (!selectedPiece) return

		const handlePointerMove = event => {
			cursorPositionRef.current = { x: event.clientX, y: event.clientY }

			if (cursorFrameRef.current) return

			cursorFrameRef.current = requestAnimationFrame(() => {
				cursorFrameRef.current = null
				const element = cursorPieceRef.current

				if (!element) return

				const { width, height } = element.getBoundingClientRect()
				element.style.transform = `translate3d(${cursorPositionRef.current.x - width / 2}px, ${cursorPositionRef.current.y - height / 2}px, 0)`
			})
		}

		window.addEventListener('pointermove', handlePointerMove, { passive: true })

		return () => {
			window.removeEventListener('pointermove', handlePointerMove)
			cancelAnimationFrame(cursorFrameRef.current)
			cursorFrameRef.current = null
		}
	}, [selectedPiece])

	useEffect(() => () => clearTimeout(hoverTimerRef.current), [])

	useEffect(() => {
		if (!selectedPiece) return

		const handleOutsidePointerDown = event => {
			if (event.target.closest('[data-game-board]')) return

			validationSequenceRef.current += 1
			clearTimeout(hoverTimerRef.current)
			lastHoverTargetRef.current = null
			setHoverCells([])
			setSelectedPieceName(null)
		}

		document.addEventListener('pointerdown', handleOutsidePointerDown, true)

		return () => {
			document.removeEventListener('pointerdown', handleOutsidePointerDown, true)
		}
	}, [selectedPiece])

	const handleCopyInvite = async () => {
		await navigator.clipboard.writeText(gameId)
		setLastMessage('Invite code copied.')
	}

	const handleQuit = async () => {
		if (
			!credentials ||
			!window.confirm('Quit this game? Your pieces will be removed from the board.')
		) {
			return
		}

		setIsQuitting(true)

		try {
			await quitGame(gameId, credentials)

			localStorage.removeItem(storageKey)
			socketRef.current?.close()
			onLeaveGame()
		} catch (err) {
			setLastMessage(err.message)
			setIsQuitting(false)
		}
	}

	const handleRestart = async () => {
		if (!credentials || game?.status !== 'finished') {
			return
		}

		setIsRestarting(true)

		try {
			const restartedGame = await restartGame(gameId, credentials)
			setGame(restartedGame)
			setSelectedPieceName(null)
			setHoverCells([])
			setLastMessage(restartedGame.notice || '')
		} catch (err) {
			setLastMessage(err.message)
		} finally {
			setIsRestarting(false)
		}
	}

	const handleTileClick = () => {
		if (!canMove || !selectedPiece || hoverCells.length === 0) {
			return
		}

		validationSequenceRef.current += 1
		clearTimeout(hoverTimerRef.current)
		socketRef.current?.send(JSON.stringify({
			type: 'place_piece',
			pieceName: selectedPiece.name,
			cells: hoverCells,
		}))

		setSelectedPieceName(null)
		setHoverCells([])
	}

	const handleBoardLeave = useCallback(() => {
		validationSequenceRef.current += 1
		clearTimeout(hoverTimerRef.current)
		lastHoverTargetRef.current = null
		setHoverCells([])
	}, [])

	const handleTileHover = useCallback((row, col, viewRow, viewCol, offsetX = 0.5, offsetY = 0.5) => {
		const validationSequence = ++validationSequenceRef.current
		clearTimeout(hoverTimerRef.current)
		lastHoverTargetRef.current = { row, col, viewRow, viewCol, offsetX, offsetY }

		if (!canMove || !selectedPiece || !credentials) {
			setHoverCells([])
			return
		}

		setHoverCells([])

		const rotatedCells = rotationForCells(selectedPiece.cells, selectedPiece.rotation)
		const minRow = Math.min(...rotatedCells.map(cell => cell[0]))
		const minCol = Math.min(...rotatedCells.map(cell => cell[1]))
		const pieceRows = Math.max(...rotatedCells.map(cell => cell[0])) - minRow + 1
		const pieceCols = Math.max(...rotatedCells.map(cell => cell[1])) - minCol + 1
		const anchorViewRow = Math.round(viewRow + offsetY - pieceRows / 2)
		const anchorViewCol = Math.round(viewCol + offsetX - pieceCols / 2)
		const newHoverCells = []

		for (const cell of rotatedCells) {
			const newViewRow = anchorViewRow + (cell[0] - minRow)
			const newViewCol = anchorViewCol + (cell[1] - minCol)

			if (
				newViewRow < 0 ||
				newViewRow >= BOARD_SIZE ||
				newViewCol < 0 ||
				newViewCol >= BOARD_SIZE
			) {
				setHoverCells([])
				return
			}

			const { row: newRow, col: newCol } = viewToBoard(
				newViewRow,
				newViewCol,
				boardRotation,
				BOARD_SIZE
			)

			if (board[newRow][newCol].occupied) {
				setHoverCells([])
				return
			}

			newHoverCells.push({
				row: newRow,
				col: newCol,
			})
		}

		hoverTimerRef.current = setTimeout(async () => {
			try {
				const result = await validateMove(
					gameId,
					credentials,
					newHoverCells,
					selectedPiece.name
				)

				if (validationSequence !== validationSequenceRef.current) return

				setHoverCells(result.valid ? newHoverCells : [])
			} catch (err) {
				if (validationSequence !== validationSequenceRef.current) return

				setHoverCells([])
				setLastMessage(err.message)
			}
		}, 55)
	}, [board, boardRotation, canMove, credentials, gameId, selectedPiece])

	useEffect(() => {
		const hoverTarget = lastHoverTargetRef.current

		if (!hoverTarget || !selectedPiece) return

		handleTileHover(
			hoverTarget.row,
			hoverTarget.col,
			hoverTarget.viewRow,
			hoverTarget.viewCol,
			hoverTarget.offsetX,
			hoverTarget.offsetY
		)
	}, [handleTileHover, selectedPiece])

	if (!game) {
		return (
			<div className={classes.startPage}>
				<h1 className={classes.gameTitle}>Blokus</h1>

				<div className={classes.startPanel}>
					<h2>Loading game...</h2>

					{lastMessage && (
						<div className={clsx(classes.statusMessage, classes.statusMessageError)}>
							{lastMessage}
						</div>
					)}
				</div>
			</div>
		)
	}

	if (!credentials) {
		return null
	}

	return (
		<>
		{selectedPiece && createPortal(
			<CursorPiece
				piece={selectedPiece}
				rotation={selectedPiece.rotation}
				color={me?.color}
				classes={classes}
				cursorRef={cursorPieceRef}
				position={cursorPosition}
			/>,
			document.body
		)}
		<div className={classes.gamePage}>
			<header className={classes.gameHeader}>
				<div className={classes.gameBrand}>
					<h1 className={clsx(classes.gameTitle, classes.gameHeaderTitle)}>
						Blokus
					</h1>

					<div className={classes.connectionRow}>
						<span
							className={clsx(
								classes.connectionDot,
								classes[connectionStatus]
							)}
						/>

						{connectionStatus}
					</div>
				</div>

				<div className={classes.gameActions}>
					<div className={classes.headerCode}>
						Code <strong>{gameId}</strong>
					</div>

					<button
						className={clsx(classes.headerActionButton, classes.copyButton)}
						onClick={handleCopyInvite}
					>
						<svg aria-hidden="true" viewBox="0 0 24 24">
							<rect x="8" y="8" width="11" height="11" rx="2" />
							<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
						</svg>

						Copy Code
					</button>

					<button
						className={clsx(classes.headerActionButton, classes.dangerButton)}
						onClick={handleQuit}
						disabled={isQuitting}
					>
						<svg aria-hidden="true" viewBox="0 0 24 24">
							<path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
							<path d="M14 8l4 4-4 4M9 12h9" />
						</svg>

						{isQuitting ? 'Quitting...' : 'Quit Game'}
					</button>
				</div>
			</header>

			{lastMessage && (
				<div className={classes.statusMessage}>
					{lastMessage}
				</div>
			)}

			<div className={classes.gameMain}>
				<aside className={classes.playersLeftPanel}>
					<div className={classes.playerPanelGrid}>
						{playerProgress.map(progress => {
							const isMe = progress.player?.id === credentials.playerId
							const isActiveTurn = progress.player?.id === game.currentPlayerId

							return (
								<div
									key={progress.name}
									className={clsx(classes.playerStatusCard, {
										[classes.playerStatusActive]: isActiveTurn,
										[classes.playerStatusEmpty]: !progress.player,
									})}
									style={{ '--player-color': progress.color }}
								>
									<div className={classes.playerStatusHeader}>
										<div className={classes.playerStatusName}>
											<span className={classes.playerStatusColor} />
											{progress.name}
										</div>

										{isMe && (
											<span className={classes.playerStatusYou}>You</span>
										)}
									</div>

									<div className={classes.playerStatusConnection}>
										<span />
										{progress.player
											? progress.player.isOutOfMoves || isFinished
												? 'Out of moves'
												: progress.player.connected ? 'Online' : 'Offline'
											: 'Waiting'}
									</div>

									<div className={classes.playerStatusBody}>
										<div>
											<div className={classes.playerStatusBlocks}>
												{progress.placedBlocks}
											</div>

											<div className={classes.playerStatusCaption}>
												blocks placed
											</div>
										</div>
									</div>
								</div>
							)
						})}
					</div>

					<div className={classes.progressOverview}>
						<div className={classes.progressOverviewTitle}>
							Progress overview
						</div>

						<div className={classes.progressOverviewCard}>
							{playerProgress.map(progress => {
								const isMe = progress.player?.id === credentials.playerId
								const filledSegments = Math.round(progress.progress * PROGRESS_SEGMENTS)

								return (
									<div key={progress.name} className={classes.progressOverviewRow}>
										<div className={classes.progressOverviewName}>
											<span style={{ background: progress.color }} />
											{progress.name}
											{isMe ? ' (You)' : ''}
										</div>

										<div
											className={classes.progressSegments}
											aria-label={`${progress.placedBlocks} of ${progress.totalBlocks || 0} blocks placed`}
										>
											{Array.from({ length: PROGRESS_SEGMENTS }).map((_, index) => (
												<span
													key={index}
													style={{
														background: index < filledSegments
															? progress.color
															: '#dce7ef',
													}}
												/>
											))}
										</div>

										<div className={classes.progressOverviewCount}>
											{progress.placedBlocks} placed
										</div>
									</div>
								)
							})}
						</div>
					</div>
				</aside>

				<div className={classes.boardCenter}>
					{(game?.status === 'playing' || isFinished) &&
						<div
							className={clsx(classes.turnBanner, isFinished && classes.finishedBanner)}
							style={{ '--turn-color': isFinished ? winner?.color || '#f3b51b' : currentPlayer?.color || '#f3b51b' }}
						>
							<div className={classes.turnAvatar} aria-hidden="true">
								<svg viewBox="0 0 24 24">
									<circle cx="12" cy="8" r="4" />
									<path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
								</svg>
							</div>

							<div className={classes.turnText}>
								<div className={classes.turnTitle}>
									{isFinished
										? `${winner?.name || 'A player'} won!`
										: canMove ? 'Your Turn!' : currentPlayer?.name + '\'s Turn'}
								</div>

								<div className={classes.turnSubtitle}>
									{isFinished
										? 'Game finished'
										: canMove ? 'Place a piece on the board' : 'Waiting...'}
								</div>
							</div>

							{isFinished && (
								<button
									className={classes.restartButton}
									onClick={handleRestart}
									disabled={isRestarting}
								>
									<svg aria-hidden="true" viewBox="0 0 24 24">
										<path d="M3 12a9 9 0 1 0 3-6.7" />
										<path d="M3 4v5h5" />
									</svg>

									{isRestarting ? 'Starting...' : 'New Game'}
								</button>
							)}
						</div>
					}

					<div className={classes.boardFrame}>
						<Board
							classes={classes}
							board={board}
							boardRotation={boardRotation}
							onTileClick={handleTileClick}
							onTileHover={handleTileHover}
							onBoardLeave={handleBoardLeave}
							hoverCells={hoverCells}
						/>

						{isWaitingForPlayers && (
							<div className={classes.boardLockOverlay}>
								<div className={classes.readyDial}>
									<svg
										className={classes.readyRingSvg}
										viewBox="0 0 220 220"
										aria-hidden="true"
									>
										{PLAYER_SEATS.map((seat, index) => {
											const isReady = joinedPlayerNames.has(seat.name)

											const arcPaths = [
												'M 110 20 A 90 90 0 0 1 200 110',
												'M 200 110 A 90 90 0 0 1 110 200',
												'M 110 200 A 90 90 0 0 1 20 110',
												'M 20 110 A 90 90 0 0 1 110 20',
											]

											return (
												<path
													key={seat.name}
													d={arcPaths[index]}
													className={classes.readyArc}
													style={{
														'--seat-color': isReady ? seat.color : '#d9e4ee',
													}}
												/>
											)
										})}

										{PLAYER_SEATS.map((seat, index) => {
											const isReady = joinedPlayerNames.has(seat.name)

											const dotPositions = [
												{ cx: 110, cy: 20 },
												{ cx: 200, cy: 110 },
												{ cx: 110, cy: 200 },
												{ cx: 20, cy: 110 },
											]

											return (
												<circle
													key={`${seat.name}-dot`}
													cx={dotPositions[index].cx}
													cy={dotPositions[index].cy}
													r="12"
													className={clsx(classes.readySeatDot, {
														[classes.readySeatDotFilled]: isReady,
													})}
													style={{ '--seat-color': seat.color }}
												/>
											)
										})}
									</svg>

									<div className={classes.readyContent}>

										<div className={classes.readyCount}>
											{readyCount} of {REQUIRED_PLAYERS}
										</div>

										<div className={classes.readyLabel}>players ready</div>

										<div className={classes.readyMessage}>
											Waiting for more
											<br />
											players...
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className={classes.piecesRight}>
					<div className={classes.piecePanelHeader}>
						<div className={classes.currentPlayerDetails}>
							<div className={classes.panelEyebrow}>Current player</div>

							<div className={classes.panelPlayerName}>
								<span
									className={classes.panelPlayerColor}
									style={{ background: me?.color }}
								/>

								{me?.name || 'Joining...'}
							</div>

							<div className={classes.panelSubtitle}>
								{isFinished ? 'Board review' : 'Choose a piece to place'}
							</div>
						</div>

						<div className={classes.placementHint}>
							<span className={classes.hintPieceIcon} />

							<span>
								Tap a piece to
								<br />
								see where it fits
							</span>
						</div>
					</div>

					<div className={classes.pieceCardGrid}>
						{pieces.filter(piece => !piece.placed).map(piece => (
							<Piece
								classes={classes}
								key={piece.name}
								piece={piece}
								placed={piece.placed}
								color={me?.color}
								isSelected={selectedPieceName === piece.name}
								onClick={event => {
									if (!piece.placed && canMove) {
										cursorPositionRef.current = {
											x: event.clientX,
											y: event.clientY,
										}
										setCursorPosition(cursorPositionRef.current)
										setSelectedPieceName(piece.name)
									}
								}}
								rotation={piece.rotation}
							/>
						))}
					</div>

					<div className={classes.piecesRemaining}>
						<div>
							Pieces remaining:{' '}
							<strong>{pieces.filter(piece => !piece.placed).length}</strong>
						</div>

						<div className={classes.remainingDots} aria-hidden="true">
							{Array.from({ length: (pieces.length - (pieces.filter(piece => piece.placed).length)) }).map((_, index) => (
								<span
									key={`not-placed-${index}`}
									className={classes.unused}
									style={{ '--piece-color': me?.color }}
								/>
							))}
							{Array.from({ length: (pieces.filter(piece => piece.placed).length) }).map((_, index) => (
								<span
									key={`placed-${index}`}
									className={classes.used}
									style={{ '--piece-color': me?.color }}
								/>
							))}
						</div>
					</div>

					{isWaitingForPlayers && (
						<div className={classes.piecePanelLockOverlay}>
							<div className={classes.piecePanelLockIcon} aria-hidden="true">
								<svg viewBox="0 0 24 24">
									<rect x="5" y="10" width="14" height="10" rx="2" />
									<path d="M8 10V7a4 4 0 0 1 8 0v3" />
									<path d="M12 14v3" />
								</svg>
							</div>

							<div className={classes.piecePanelLockMessage}>
								Waiting for all players
								<br />
								to join before pieces
								<br />
								can be placed
							</div>
						</div>
					)}
				</div>
			</div>

			{isFinished && !isWinnerModalClosed && (
				<div className={classes.modalBackdrop}>
					<div className={classes.winnerModal}>
						<button
							className={classes.modalCloseButton}
							onClick={() => setIsWinnerModalClosed(true)}
							aria-label="Close winner summary"
						>
							<svg aria-hidden="true" viewBox="0 0 24 24">
								<path d="M18 6 6 18" />
								<path d="m6 6 12 12" />
							</svg>
						</button>

						<div
							className={classes.winnerBadge}
							style={{ '--winner-color': winner?.color || '#f3b51b' }}
						>
							<svg aria-hidden="true" viewBox="0 0 24 24">
								<path d="M6 9 8 20h8l2-11-4 3-2-6-2 6-4-3Z" />
								<path d="M8 20h8" />
							</svg>
						</div>

						<div className={classes.winnerTitle}>
							{winner?.name || 'A player'} won!
						</div>

						<div className={classes.winnerSubtitle}>
							Final leaderboard
						</div>

						<div className={classes.leaderboardList}>
							{leaderboard.map((entry, index) => (
								<div
									key={entry.playerId}
									className={classes.leaderboardRow}
									style={{ '--leader-color': entry.color }}
								>
									<div className={classes.leaderboardRank}>
										{index + 1}
									</div>

									<div className={classes.leaderboardName}>
										<span />
										{entry.name}
									</div>

									<div className={classes.leaderboardBlocks}>
										{entry.blocksPlaced} blocks
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
		</>
	)
}

export default GameScreen
