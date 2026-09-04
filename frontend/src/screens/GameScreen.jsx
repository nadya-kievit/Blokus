import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { gameSocketUrl, getGame, quitGame, restartGame } from '../services/api'
import Board from '../components/Board'
import CursorPiece from '../components/CursorPiece'
import Header from '../components/Header'
import PiecePanel from '../components/PiecePanel'
import PlayerRank from '../components/PlayerRank'
import TurnBanner from '../components/TurnBanner'
import WaitingOverlay from '../components/WaitingOverlay'
import WinnerModal from '../components/WinnerModal'
import { PLAYER_COLOR_HEX, getPlayerColorHex } from '../playerColors'

const BOARD_SIZE = 20
const EMPTY_BOARD = Array(BOARD_SIZE).fill(null).map(() =>
	Array(BOARD_SIZE).fill(null).map(() => ({
		occupied: false,
		player: null,
		color: null,
	}))
)


function rotationForCells(cells, rotation, flipped = false) {
	return cells.map(([row, col]) => {
		const transformedCol = flipped ? -col : col

		switch (rotation) {
			case 90:
				return [-transformedCol, row]
			case 180:
				return [-row, -transformedCol]
			case 270:
				return [transformedCol, -row]
			default:
				return [row, transformedCol]
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


function isValidPlacement(board, cells, player, isFirstMove) {
	if (cells.some(cell => board[cell.row][cell.col].occupied)) return false

	if (isFirstMove) {
		return cells.some(cell =>
			cell.row === player.corner.row && cell.col === player.corner.col
		)
	}

	let touchesOwnPieceDiagonally = false

	for (const cell of cells) {
		const sideNeighbors = [
			[cell.row - 1, cell.col],
			[cell.row + 1, cell.col],
			[cell.row, cell.col - 1],
			[cell.row, cell.col + 1],
		]

		if (sideNeighbors.some(([row, col]) =>
			row >= 0 && row < BOARD_SIZE &&
			col >= 0 && col < BOARD_SIZE &&
			board[row][col].player === player.id
		)) return false

		const diagonalNeighbors = [
			[cell.row - 1, cell.col - 1],
			[cell.row - 1, cell.col + 1],
			[cell.row + 1, cell.col - 1],
			[cell.row + 1, cell.col + 1],
		]

		if (diagonalNeighbors.some(([row, col]) =>
			row >= 0 && row < BOARD_SIZE &&
			col >= 0 && col < BOARD_SIZE &&
			board[row][col].player === player.id
		)) touchesOwnPieceDiagonally = true
	}

	return touchesOwnPieceDiagonally
}


function canPlacePieceInOrientation(
	board,
	piece,
	rotation,
	flipped,
	player,
	boardRotation,
	isFirstMove,
) {
	const rotatedCells = rotationForCells(piece.cells, rotation, flipped)
	const minRow = Math.min(...rotatedCells.map(cell => cell[0]))
	const minCol = Math.min(...rotatedCells.map(cell => cell[1]))
	const pieceRows = Math.max(...rotatedCells.map(cell => cell[0])) - minRow + 1
	const pieceCols = Math.max(...rotatedCells.map(cell => cell[1])) - minCol + 1

	for (let anchorRow = 0; anchorRow <= BOARD_SIZE - pieceRows; anchorRow += 1) {
		for (let anchorCol = 0; anchorCol <= BOARD_SIZE - pieceCols; anchorCol += 1) {
			const cells = rotatedCells.map(cell => viewToBoard(
				anchorRow + cell[0] - minRow,
				anchorCol + cell[1] - minCol,
				boardRotation,
				BOARD_SIZE,
			))

			if (isValidPlacement(board, cells, player, isFirstMove)) {
				return true
			}
		}
	}

	return false
}


function nextPieceOrientations(rotation, flipped) {
	const normalizedRotation = rotation % 360
	const orientations = []

	for (const nextFlipped of [flipped, !flipped]) {
		for (const rotationOffset of [90, 180, 270, 0]) {
			const nextRotation = (normalizedRotation + rotationOffset) % 360

			if (nextRotation === normalizedRotation && nextFlipped === flipped) continue

			orientations.push({ rotation: nextRotation, flipped: nextFlipped })
		}
	}

	return orientations
}


function GameScreen({ gameId, onLeaveGame, onNeedsColor }) {

	const storageKey = `blokit-player-${gameId}`
	const socketRef = useRef(null)
	const gameMainRef = useRef(null)
	const playersPanelRef = useRef(null)
	const boardRef = useRef(null)
	const lastHoverTargetRef = useRef(null)
	const cursorPieceRef = useRef(null)
	const cursorPositionRef = useRef({ x: 0, y: 0 })
	const cursorFrameRef = useRef(null)

	const [credentials] = useState(() => {
		const stored = localStorage.getItem(storageKey)
		return stored ? JSON.parse(stored) : null
	})

	const [game, setGame] = useState(null)
	const [pieceRotations, setPieceRotations] = useState({})
	const [pieceFlips, setPieceFlips] = useState({})
	const [selectedPieceName, setSelectedPieceName] = useState(null)
	const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
	const [hoverCells, setHoverCells] = useState([])
	const [pendingPlacement, setPendingPlacement] = useState(null)
	const [lastMessage, setLastMessage] = useState('')
	const [isQuitting, setIsQuitting] = useState(false)
	const [isRestarting, setIsRestarting] = useState(false)
	const [closedWinnerTurnNumber, setClosedWinnerTurnNumber] = useState(null)

	const me = useMemo(() => 
		game?.players.find(player => player.id === credentials?.playerId),
		[game, credentials]
	)

	const canMove = game?.status === 'playing' && game.currentPlayerId === credentials?.playerId
	const board = game?.board || EMPTY_BOARD
	const isFinished = game?.status === 'finished'
	const isWinnerModalClosed = isFinished && closedWinnerTurnNumber === game?.turnNumber
	const boardRotation = rotationForCorner(me?.corner)
	const pieces = useMemo(() => {
		const isFirstMove = !me?.pieces.some(piece => piece.placed)

		return (me?.pieces || []).map(piece => {
			const rotation = pieceRotations[piece.name] || 0
			const flipped = pieceFlips[piece.name] || false
			const pieceWithOrientation = { ...piece, rotation, flipped }

			if (piece.placed || game?.status !== 'playing') return pieceWithOrientation

			if (canPlacePieceInOrientation(
				board,
				piece,
				rotation,
				flipped,
				me,
				boardRotation,
				isFirstMove,
			)) return pieceWithOrientation

			const nextOrientation = nextPieceOrientations(rotation, flipped)
				.find(orientation => canPlacePieceInOrientation(
					board,
					piece,
					orientation.rotation,
					orientation.flipped,
					me,
					boardRotation,
					isFirstMove,
				))

			return nextOrientation
				? { ...pieceWithOrientation, ...nextOrientation }
				: pieceWithOrientation
		})
	}, [board, boardRotation, game?.status, me, pieceFlips, pieceRotations])

	const playablePieceNames = useMemo(() => {
		const playableNames = new Set()

		if (!me) return playableNames

		if (game?.status !== 'playing') {
			for (const piece of pieces) {
				if (!piece.placed) playableNames.add(piece.name)
			}

			return playableNames
		}

		const isFirstMove = !me.pieces.some(piece => piece.placed)

		for (const piece of pieces) {
			if (piece.placed) continue

			const isPlayable = canPlacePieceInOrientation(
				board,
				piece,
				piece.rotation,
				piece.flipped,
				me,
				boardRotation,
				isFirstMove,
			)

			if (isPlayable) playableNames.add(piece.name)
		}

		return playableNames
	}, [board, boardRotation, game?.status, me, pieces])

	const selectedPiece = useMemo(() => 
		pieces.find(piece =>
			piece.name === selectedPieceName &&
			!piece.placed &&
			playablePieceNames.has(piece.name)
		) || null,
		[pieces, playablePieceNames, selectedPieceName]
	)
	const availablePieces = useMemo(() => pieces
		.filter(piece => !piece.placed && piece.name !== pendingPlacement?.pieceName)
		.sort((first, second) =>
			Number(playablePieceNames.has(second.name)) - Number(playablePieceNames.has(first.name))
		),
		[pendingPlacement?.pieceName, pieces, playablePieceNames]
	)
	const winners = useMemo(() => {
		const winnerIds = game?.winnerIds?.length
			? game.winnerIds
			: game?.winnerId ? [game.winnerId] : []

		return winnerIds
			.map(winnerId => game?.players.find(player => player.id === winnerId))
			.filter(Boolean)
	}, [game])
	const winner = winners[0]
	const isTie = winners.length > 1
	const resultColor = winners.length > 1
		? `linear-gradient(135deg, ${winners.map(player => getPlayerColorHex(player.color)).join(', ')})`
		: getPlayerColorHex(winner?.color, PLAYER_COLOR_HEX.Yellow)
	const leaderboard = game?.leaderboard || []
	const isWaitingForPlayers = game?.status === 'waiting'

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
			} catch (err) {
				if (isActive) {
					setLastMessage(err.message)
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
			socket.send(JSON.stringify({ type: 'request_state' }))
		}

		socket.onmessage = event => {
			const message = JSON.parse(event.data)

			if (message.type === 'game_state') {
				setGame(message.game)
				setPendingPlacement(pending => {
					if (!pending) return null

					const isConfirmed = pending.cells.every(cell =>
						message.game.board[cell.row][cell.col].pieceId === pending.pieceId
					)

					return isConfirmed ? null : pending
				})

				if (message.game.notice) {
					setLastMessage(message.game.notice)
				}
			}

			if (message.type === 'error') {
				setPendingPlacement(null)
				setLastMessage(message.reason)
			}
		}

		socket.onclose = () => {
			setPendingPlacement(null)
		}

		return () => {
			socket.close()
		}
	}, [gameId, credentials])


	useEffect(() => {
		const handleKeyDown = event => {
			if (!canMove || !selectedPiece) return

			if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) return

			event.preventDefault()

			if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				setPieceFlips(prev => ({
					...prev,
					[selectedPiece.name]: !selectedPiece.flipped,
				}))
				return
			}

			setPieceRotations(prev => {
				const rotationChange = event.key === 'ArrowRight' ? 90 : -90

				return {
					...prev,
					[selectedPiece.name]: (selectedPiece.rotation + rotationChange + 360) % 360,
				}
			})
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [canMove, selectedPiece])


	useLayoutEffect(() => {
		const gameMain = gameMainRef.current
		const playersPanel = playersPanelRef.current
		const board = boardRef.current

		if (!gameMain || !playersPanel || !board) return

		const alignPlayerPanel = () => {
			const gameMainBounds = gameMain.getBoundingClientRect()
			const boardBounds = board.getBoundingClientRect()

			playersPanel.style.top = `${boardBounds.top - gameMainBounds.top}px`
		}

		alignPlayerPanel()

		const resizeObserver = new ResizeObserver(alignPlayerPanel)
		resizeObserver.observe(gameMain)
		resizeObserver.observe(board)
		window.addEventListener('resize', alignPlayerPanel)

		return () => {
			resizeObserver.disconnect()
			window.removeEventListener('resize', alignPlayerPanel)
		}
	}, [game?.status])


	useLayoutEffect(() => {
		const element = cursorPieceRef.current

		if (!element || !selectedPiece) return

		const { width, height } = element.getBoundingClientRect()
		const { x, y } = cursorPositionRef.current

		element.style.transform =
			`translate3d(${x - width / 2}px, ${y - height / 2}px, 0)`
	}, [selectedPiece])


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


	useEffect(() => {
		if (!selectedPiece) return

		const handleOutsidePointerDown = event => {
			if (event.target.closest('[data-game-board]')) return
			if (event.target.closest('[data-game-piece]')) return

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
			setPendingPlacement(null)
			setSelectedPieceName(null)
			setHoverCells([])
			setLastMessage(restartedGame.notice || '')
		} catch (err) {
			setLastMessage(err.message)
		} finally {
			setIsRestarting(false)
		}
	}


	const handlePieceClick = (piece, event) => {
		const isPlayable = playablePieceNames.has(piece.name)

		if (piece.placed || !canMove || !isPlayable) return

		if (selectedPieceName === piece.name) {
			setSelectedPieceName(null)
			setHoverCells([])
			lastHoverTargetRef.current = null
			return
		}

		cursorPositionRef.current = {
			x: event.clientX,
			y: event.clientY,
		}
		setCursorPosition(cursorPositionRef.current)
		setSelectedPieceName(piece.name)
	}


	const handleCloseWinnerModal = () => {
		setClosedWinnerTurnNumber(game?.turnNumber)
	}


	const handleTileClick = () => {
		if (!canMove || !selectedPiece || hoverCells.length === 0 || pendingPlacement) {
			return
		}

		setPendingPlacement({
			cells: hoverCells,
			color: me.color,
			pieceId: `${me.id}-${selectedPiece.name}`,
			pieceName: selectedPiece.name,
			playerId: me.id,
		})

		socketRef.current?.send(JSON.stringify({
			type: 'place_piece',
			pieceName: selectedPiece.name,
			cells: hoverCells,
		}))

		setSelectedPieceName(null)
		setHoverCells([])
	}


	const handleBoardLeave = useCallback(() => {
		lastHoverTargetRef.current = null
		setHoverCells([])
	}, [])


	const handleTileHover = useCallback((row, col, viewRow, viewCol, offsetX = 0.5, offsetY = 0.5) => {
		lastHoverTargetRef.current = { row, col, viewRow, viewCol, offsetX, offsetY }

		if (!canMove || !selectedPiece || !me) {
			setHoverCells([])
			return
		}

		const rotatedCells = rotationForCells(
			selectedPiece.cells,
			selectedPiece.rotation,
			selectedPiece.flipped
		)
		const minRow = Math.min(...rotatedCells.map(cell => cell[0]))
		const minCol = Math.min(...rotatedCells.map(cell => cell[1]))
		const pieceRows = Math.max(...rotatedCells.map(cell => cell[0])) - minRow + 1
		const pieceCols = Math.max(...rotatedCells.map(cell => cell[1])) - minCol + 1
		const pointerRow = viewRow + offsetY
		const pointerCol = viewCol + offsetX
		const isFirstMove = !me.pieces.some(piece => piece.placed)
		let nearestCells = []
		let nearestDistance = Infinity

		for (let anchorRow = 0; anchorRow <= BOARD_SIZE - pieceRows; anchorRow += 1) {
			for (let anchorCol = 0; anchorCol <= BOARD_SIZE - pieceCols; anchorCol += 1) {
				const cells = rotatedCells.map(cell => viewToBoard(
					anchorRow + cell[0] - minRow,
					anchorCol + cell[1] - minCol,
					boardRotation,
					BOARD_SIZE
				))

				if (!isValidPlacement(board, cells, me, isFirstMove)) continue

				const rowDistance = anchorRow + pieceRows / 2 - pointerRow
				const colDistance = anchorCol + pieceCols / 2 - pointerCol
				const distance = rowDistance ** 2 + colDistance ** 2

				if (distance < nearestDistance) {
					nearestDistance = distance
					nearestCells = cells
				}
			}
		}

		setHoverCells(nearestCells)
	}, [board, boardRotation, canMove, me, selectedPiece])


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
			<div className="startPage">
				<h1 className="gameTitle">Blokit</h1>

				<div className="startPanel">
					<h2>Loading game...</h2>

					{lastMessage && (
						<div className="statusMessage statusMessageError">
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
		<div className="gamePage">

			{selectedPiece && createPortal(
				<CursorPiece
					piece={selectedPiece}
					rotation={selectedPiece.rotation}
					flipped={selectedPiece.flipped}
					color={me?.color}
					cursorRef={cursorPieceRef}
					position={cursorPosition}
				/>,
				document.body
			)}
			
			<Header
				gameId={gameId}
				isQuitting={isQuitting}
				onCopyInvite={handleCopyInvite}
				onQuit={handleQuit}
			/>

			<div ref={gameMainRef} className="gameMain">
				{isWaitingForPlayers && <WaitingOverlay game={game} />}

				<PlayerRank
					ref={playersPanelRef}
					currentUserId={me?.id}
					game={game}
				/>

				<TurnBanner
					canMove={canMove}
					game={game}
					isRestarting={isRestarting}
					isTie={isTie}
					onRestart={handleRestart}
					resultColor={resultColor}
					winner={winner}
				/>

				<Board
					ref={boardRef}
					board={board}
					boardRotation={boardRotation}
					onTileClick={handleTileClick}
					onTileHover={handleTileHover}
					onBoardLeave={handleBoardLeave}
					hoverCells={hoverCells}
					pendingPlacement={pendingPlacement}
				/>

				<PiecePanel
					canMove={canMove}
					isWaitingForPlayers={isWaitingForPlayers}
					onPieceClick={handlePieceClick}
					pieces={availablePieces}
					playablePieceNames={playablePieceNames}
					player={me}
					selectedPieceName={selectedPieceName}
					totalPieceCount={pieces.length}
				/>
			</div>

			<WinnerModal
				isOpen={isFinished && !isWinnerModalClosed}
				isTie={isTie}
				leaderboard={leaderboard}
				onClose={handleCloseWinnerModal}
				resultColor={resultColor}
				winner={winner}
			/>
		</div>
	)
}

export default GameScreen
