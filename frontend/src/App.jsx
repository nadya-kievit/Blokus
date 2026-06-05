import { useState, useEffect } from 'react'
import { getGameState, testMove, validateMove } from './services/api'
import './App.css'
import { resetBoard } from './services/api'

import Board from './components/Board'
import Piece from './components/Piece'
import { getPieces } from './services/api'

function App() {

	const [board, setBoard] = useState(Array(20).fill(null).map(() => Array(20).fill(0) ))
	const [pieces, setPieces] = useState([])
	const [selectedPiece, setSelectedPiece] = useState(null)
	const [hoverCells, setHoverCells] = useState([])
	const [isHoverValid, setIsHoverValid] = useState(false)


	const handleReset = async () => {

		await resetBoard()

		const boardData = await getGameState()

		setBoard(boardData.board)

		const piecesData = await getPieces()
		
		setPieces(
			piecesData.pieces.map(piece => ({
				...piece,
				rotation: 0
			}))
		)

		setSelectedPiece(null)
		setHoverCells([])
	}


	const handleTileClick = async () => {

		if (hoverCells.length === 0) return
		if (!selectedPiece) return

		const result = await testMove(hoverCells, selectedPiece.name)

		if (!result.success) {
			console.log(result.reason)
			return
		}

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


	const handleTileHover = async (row, col) => {

		if (!selectedPiece) {
			setHoverCells([])
			return
		}

		const rotatedCells = selectedPiece.cells.map(([row, col]) => {
			switch (selectedPiece.rotation) {
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
		const newHoverCells = []
		const minRow = Math.min(...rotatedCells.map(c => c[0]))
		const minCol = Math.min(...rotatedCells.map(c => c[1]))

		for (const cell of rotatedCells) {

			const newRow = row + (cell[0] - minRow)
			const newCol = col + (cell[1] - minCol)

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

		const result = await validateMove(newHoverCells, selectedPiece.name)
		setIsHoverValid(result.valid);

		setHoverCells(newHoverCells)
	}


	useEffect(() => {
		async function loadPieces() {
			const data = await getPieces()
			setPieces(
				data.pieces.map(piece => ({
					...piece,
					rotation: 0
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

			setPieces(prev => {

				const updatedPieces = prev.map(piece => {

					if (piece.name !== selectedPiece.name) {
						return piece
					}

					let newRotation = piece.rotation

					if (event.key === 'ArrowRight') {
						newRotation = (piece.rotation + 90) % 360
					}

					if (event.key === 'ArrowLeft') {
						newRotation = (piece.rotation - 90 + 360) % 360
					}

					return {
						...piece,
						rotation: newRotation
					}
				})

				const updatedSelectedPiece =
					updatedPieces.find(
						p => p.name === selectedPiece.name
					)

				setSelectedPiece(updatedSelectedPiece)

				return updatedPieces
			})
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}

	}, [selectedPiece])


	return (
		<div>
			<h1>Blokus</h1>

			<div style={{ display: 'flex', gap: '50px', alignItems: 'flex-start' }} >

				<Board
					board={board}
					onTileClick={handleTileClick}
					onTileHover={handleTileHover}
					hoverCells={hoverCells}
					isHoverValid={isHoverValid}
				/>

				<div style={{ width: '500px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignContent: 'flex-start' }} >

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
							rotation={piece.rotation}
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