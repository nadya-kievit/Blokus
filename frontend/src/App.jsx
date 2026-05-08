import { useState, useEffect } from 'react'
import { getGameState, testMove } from './services/api'
import './App.css'

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

	const handleTileClick = async (row, col) => {
		console.log(`Clicked tile: ${row}, ${col}`)

		await testMove(row, col)
		const data = await getGameState()
		setBoard(data.board)
	}

	useEffect(() => {
		async function loadPieces() {
			const data = await getPieces()
			setPieces(data.pieces)
		}

		loadPieces()
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
							isSelected={selectedPiece?.name === piece.name}
							onClick={() => setSelectedPiece(piece)}
							rotation={
								selectedPiece?.name === piece.name
									? rotation
									: 0
							}
						/>
					))}

				</div>

			</div>
		</div>
	)
}

export default App