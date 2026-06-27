import Tile from './Tile'

function Board({ board, onTileClick, onTileHover, hoverCells, isHoverValid, classes }) {

	return (
		<div className={classes.board}>

			{board.map((row, rowIndex) =>
				row.map((cell, colIndex) => (
					<Tile
						classes={classes}
						key={`${rowIndex}-${colIndex}`}
						value={cell}
						row={rowIndex}
						col={colIndex}
						onClick={onTileClick}
						isHovered={hoverCells.some(cell => cell.row === rowIndex && cell.col === colIndex)}
						isHoverValid={isHoverValid}
						onHover={onTileHover}
						neighbors={{
							top: rowIndex > 0 ? board[rowIndex - 1][colIndex] : null,
							bottom: rowIndex < board.length - 1 ? board[rowIndex + 1][colIndex] : null,
							left: colIndex > 0 ? board[rowIndex][colIndex - 1] : null,
							right: colIndex < row.length - 1 ? board[rowIndex][colIndex + 1] : null,
						}}
						hoverNeighbors={{
							top: hoverCells.some(cell => cell.row === rowIndex - 1 && cell.col === colIndex),
							bottom: hoverCells.some(cell => cell.row === rowIndex + 1 && cell.col === colIndex),
							left: hoverCells.some(cell => cell.row === rowIndex && cell.col === colIndex - 1),
							right: hoverCells.some(cell => cell.row === rowIndex && cell.col === colIndex + 1),
						}}
					/>
				))
			)}

		</div>
	)
}

export default Board
