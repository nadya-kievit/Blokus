import { useEffect, useMemo, useRef, useState } from 'react'
import { makeStyles } from 'tss-react/mui'
import clsx from 'clsx'
import {
	gameSocketUrl,
	getGame,
	quitGame,
	validateMove,
} from '../services/api'
import gameStyles from '../gameStyles'
import Board from '../components/Board'
import Piece from '../components/Piece'

const useStyles = makeStyles()(gameStyles)

const BOARD_SIZE = 20

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

function GameScreen({ gameId, onLeaveGame, onNeedsColor }) {
	const { classes } = useStyles()

	const storageKey = `blokus-player-${gameId}`
	const socketRef = useRef(null)

	const [credentials] = useState(() => {
		const stored = localStorage.getItem(storageKey)
		return stored ? JSON.parse(stored) : null
	})

	const [game, setGame] = useState(null)
	const [pieceRotations, setPieceRotations] = useState({})
	const [selectedPieceName, setSelectedPieceName] = useState(null)
	const [hoverCells, setHoverCells] = useState([])
	const [isHoverValid, setIsHoverValid] = useState(false)
	const [connectionStatus, setConnectionStatus] = useState('joining')
	const [lastMessage, setLastMessage] = useState('')
	const [isQuitting, setIsQuitting] = useState(false)

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
	const boardRotation = rotationForCorner(me?.corner)

	useEffect(() => {
		if (game && !credentials) {
			onNeedsColor()
		}
	}, [game, credentials, onNeedsColor])

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

	const handleTileClick = () => {
		if (!canMove || !selectedPiece || !isHoverValid || hoverCells.length === 0) {
			return
		}

		socketRef.current?.send(JSON.stringify({
			type: 'place_piece',
			pieceName: selectedPiece.name,
			cells: hoverCells,
		}))

		setSelectedPieceName(null)
		setHoverCells([])
	}

	const handleTileHover = async (row, col, viewRow, viewCol) => {
		if (!canMove || !selectedPiece || !credentials) {
			setHoverCells([])
			return
		}

		const rotatedCells = rotationForCells(selectedPiece.cells, selectedPiece.rotation)
		const minRow = Math.min(...rotatedCells.map(cell => cell[0]))
		const minCol = Math.min(...rotatedCells.map(cell => cell[1]))
		const newHoverCells = []

		for (const cell of rotatedCells) {
			const newViewRow = viewRow + (cell[0] - minRow)
			const newViewCol = viewCol + (cell[1] - minCol)

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

		try {
			const result = await validateMove(
				gameId,
				credentials,
				newHoverCells,
				selectedPiece.name
			)

			setIsHoverValid(result.valid)
			setHoverCells(newHoverCells)
		} catch (err) {
			setIsHoverValid(false)
			setLastMessage(err.message)
		}
	}

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

			<div className={classes.playersBar}>
				{game?.players.map(player => (
					<div
						key={player.id}
						className={clsx(classes.playerPill, {
							[classes.active]: player.id === game.currentPlayerId,
						})}
						style={{ borderColor: player.color }}
					>
						<span
							className={classes.playerColor}
							style={{ background: player.color }}
						/>

						{player.name}

						<span className={classes.playerSeat}>
							{player.connected ? 'online' : 'offline'}
						</span>
					</div>
				))}

				{game &&
					Array(4 - game.players.length)
						.fill(null)
						.map((_, index) => (
							<div
								key={`empty-${index}`}
								className={clsx(classes.playerPill, classes.empty)}
							>
								Waiting
							</div>
						))}
			</div>

			{lastMessage && (
				<div className={classes.statusMessage}>
					{lastMessage}
				</div>
			)}

			<div className={classes.gameMain}>
				<div className={classes.boardCenter}>
					{game?.status === 'playing' &&
						<div className={classes.turnBanner}
							style={{ '--turn-color': currentPlayer?.color || '#f3b51b' }}
						>
							<div className={classes.turnAvatar} aria-hidden="true">
								<svg viewBox="0 0 24 24">
									<circle cx="12" cy="8" r="4" />
									<path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
								</svg>
							</div>

							<div className={classes.turnText}>
								<div className={classes.turnTitle}>
									{canMove ? 'Your Turn!' : currentPlayer?.name + '\'s Turn'}
								</div>

								<div className={classes.turnSubtitle}>
									{canMove ? 'Place a piece on the board' : 'Waiting...'}
								</div>
							</div>
						</div>
					}

					<Board
						classes={classes}
						board={board}
						boardRotation={boardRotation}
						onTileClick={handleTileClick}
						onTileHover={handleTileHover}
						hoverCells={hoverCells}
						isHoverValid={isHoverValid}
					/>
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
								Choose a piece to place
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
						{pieces.map(piece => (
							<Piece
								classes={classes}
								key={piece.name}
								piece={piece}
								placed={piece.placed}
								color={me?.color}
								isSelected={selectedPieceName === piece.name}
								onClick={() => {
									if (!piece.placed && canMove) {
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
							{pieces.map(piece => (
								<span
									key={piece.name}
									className={piece.placed ? classes.used : undefined}
									style={{ '--piece-color': me?.color }}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default GameScreen
