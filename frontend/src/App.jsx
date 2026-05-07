import { useState } from 'react'
import './App.css'

import Board from './components/Board'

function App() {

  const [board, setBoard] = useState(
    Array(20).fill(null).map(() =>
      Array(20).fill(0)
    )
  )

  const handleTileClick = (row, col) => {
    console.log(`Clicked tile: ${row}, ${col}`)

    const newBoard = [...board]

    newBoard[row][col] = 1

    setBoard(newBoard)
  }

  return (
    <div>
      <h1>Blokus</h1>

      <Board
        board={board}
        onTileClick={handleTileClick}
      />
    </div>
  )
}

export default App