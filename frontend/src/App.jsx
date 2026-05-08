import { useState, useEffect } from 'react'
import { getGameState, testMove } from './services/api'
import './App.css'
import { resetBoard } from './services/api'

import Board from './components/Board'
import Piece from './components/Piece'
import { getPieces } from './services/api'

function App() {

	const [board, setBoard] = useState(
		Array(20).fill(null).map(() =>
			Array(20).fill(0)
		)
	)
	const [pieces, setPieces] = useState([])
	const [selectedPiece, setSelectedPiece] = useState(null)
	const [rotation, setRotation] = useState(0)
	const [hoverCells, setHoverCells] = useState([])


	const handleReset = async () => {

		await resetBoard()

		const boardData = await getGameState()

		setBoard(boardData.board)

		setPieces(prev =>
			prev.map(piece => ({
				...piece,
				placed: false
			}))
		)

		setSelectedPiece(null)
		setHoverCells([])
	}


	const handleTileClick = async () => {

		if (hoverCells.length === 0) return

		await testMove(hoverCells)

		const data = await getGameState()

		setBoard(data.board)

		setPieces(prev =>
			prev.map(piece =>
				piece.name === selectedPiece.name
					? { ...piece, placed: true }
					: piece
			)
		)

		setSelectedPiece(null)
		setHoverCells([])
	}


	const handleTileHover = (row, col) => {

		console.log(rotation);

		if (!selectedPiece) {
			setHoverCells([])
			return
		}

		const newHoverCells = []

		for (const cell of selectedPiece.cells) {

			const newRow = row + cell[0]
			const newCol = col + cell[1]

			// Out of bounds check
			if (
				newRow < 0 ||
				newRow >= 20 ||
				newCol < 0 ||
				newCol >= 20
			) {
				setHoverCells([])
				return
			}

			//already occupied check
			if (board[newRow][newCol].occupied) {
				setHoverCells([])
				return
			}

			newHoverCells.push({
				row: newRow,
				col: newCol
			})
		}

		setHoverCells(newHoverCells)
	}


	useEffect(() => {
		async function loadPieces() {
			const data = await getPieces()
			setPieces(
				data.pieces.map(piece => ({
					...piece,
					placed: false
				}))
			)
		}
		loadPieces()
	}, [])


	useEffect(() => {
		async function loadBoard() {
			const data = await getGameState()
			setBoard(data.board)
		}
		loadBoard()
	}, [])


	useEffect(() => {
		const handleKeyDown = (event) => {

			if (!selectedPiece) return
			if (event.key === 'ArrowRight') {
				setRotation(prev => (prev + 90) % 360)
			}
			if (event.key === 'ArrowLeft') {
				setRotation(prev => (prev - 90 + 360) % 360)
			}
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}

	}, [selectedPiece])


	return (
		<div>
			<h1>Blokus</h1>

			<div
				style={{
					display: 'flex',
					gap: '50px',
					alignItems: 'flex-start'
				}}
			>

				<Board
					board={board}
					onTileClick={handleTileClick}
					onTileHover={handleTileHover}
					hoverCells={hoverCells}
				/>

				<div
					style={{
						width: '500px',
						display: 'flex',
						flexWrap: 'wrap',
						gap: '20px',
						alignContent: 'flex-start'
					}}
				>

					{pieces.map((piece, index) => (
						<Piece
							key={index}
							piece={piece}
							placed={piece.placed}
							isSelected={selectedPiece?.name === piece.name}
							onClick={() => {
								if (!piece.placed) {
									setSelectedPiece(piece)
								}
							}}
							rotation={
								selectedPiece?.name === piece.name
									? rotation
									: 0
							}
						/>
					))}

				</div>
			</div>
			<div>
				<button onClick={handleReset}>Reset Board</button>
			</div>
		</div>
	)
}

export default App