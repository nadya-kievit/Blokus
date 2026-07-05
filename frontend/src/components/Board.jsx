import Tile from './Tile'

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

function Board({ board, boardRotation = 0, onTileClick, onTileHover, hoverCells, isHoverValid, classes }) {
	const boardSize = board.length
	const displayedCells = board.map((row, viewRow) =>
		row.map((_, viewCol) => {
			const boardPosition = viewToBoard(viewRow, viewCol, boardRotation, boardSize)

			return {
				...boardPosition,
				value: board[boardPosition.row][boardPosition.col],
			}
		})
	)

	const isHoveredAt = (row, col) =>
		hoverCells.some(cell => cell.row === row && cell.col === col)

	const isHoveredViewCell = (viewRow, viewCol) => {
		const cell = displayedCells[viewRow]?.[viewCol]

		return cell ? isHoveredAt(cell.row, cell.col) : false
	}

	return (
		<div className={classes.board}>

			{displayedCells.map((row, viewRow) =>
				row.map((cell, viewCol) => (
					<Tile
						classes={classes}
						key={`${cell.row}-${cell.col}`}
						value={cell.value}
						row={cell.row}
						col={cell.col}
						viewRow={viewRow}
						viewCol={viewCol}
						onClick={onTileClick}
						isHovered={isHoveredAt(cell.row, cell.col)}
						isHoverValid={isHoverValid}
						onHover={onTileHover}
						neighbors={{
							top: viewRow > 0 ? displayedCells[viewRow - 1][viewCol].value : null,
							bottom: viewRow < displayedCells.length - 1
								? displayedCells[viewRow + 1][viewCol].value
								: null,
							left: viewCol > 0 ? displayedCells[viewRow][viewCol - 1].value : null,
							right: viewCol < row.length - 1
								? displayedCells[viewRow][viewCol + 1].value
								: null,
						}}
						hoverNeighbors={{
							top: isHoveredViewCell(viewRow - 1, viewCol),
							bottom: isHoveredViewCell(viewRow + 1, viewCol),
							left: isHoveredViewCell(viewRow, viewCol - 1),
							right: isHoveredViewCell(viewRow, viewCol + 1),
						}}
					/>
				))
			)}

		</div>
	)
}

export default Board
