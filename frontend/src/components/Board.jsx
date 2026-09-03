import Tile from './Tile'

function Board({board, boardRotation = 0, onTileClick, onTileHover, onBoardLeave, hoverCells, pendingPlacement}) {
	const boardSize = board.length
	const pendingCells = new Set(
		(pendingPlacement?.cells || []).map(cell => `${cell.row},${cell.col}`)
	)

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

	const displayedCells = board.map((row, viewRow) =>
		row.map((_, viewCol) => {
			const boardPosition = viewToBoard(viewRow, viewCol, boardRotation, boardSize)
			const isPending = pendingCells.has(`${boardPosition.row},${boardPosition.col}`)

			return {
				...boardPosition,
				value: isPending
					? {
						occupied: true,
						player: pendingPlacement.playerId,
						pieceId: pendingPlacement.pieceId,
						color: pendingPlacement.color,
					}
					: board[boardPosition.row][boardPosition.col],
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
		<div className="board" data-game-board onMouseLeave={onBoardLeave}>
			{displayedCells.map((row, viewRow) =>
				row.map((cell, viewCol) => {
					const neighbors = {
							top: viewRow > 0 ? displayedCells[viewRow - 1][viewCol].value : null,
							bottom: viewRow < displayedCells.length - 1
								? displayedCells[viewRow + 1][viewCol].value
								: null,
							left: viewCol > 0 ? displayedCells[viewRow][viewCol - 1].value : null,
							right: viewCol < row.length - 1
								? displayedCells[viewRow][viewCol + 1].value
								: null,
					}
					const hoverNeighbors = {
							top: isHoveredViewCell(viewRow - 1, viewCol),
							bottom: isHoveredViewCell(viewRow + 1, viewCol),
							left: isHoveredViewCell(viewRow, viewCol - 1),
							right: isHoveredViewCell(viewRow, viewCol + 1),
					}

					return (
						<Tile
							key={`${cell.row}-${cell.col}`}
							value={cell.value}
							row={cell.row}
							col={cell.col}
							viewRow={viewRow}
							viewCol={viewCol}
							onClick={onTileClick}
							isHovered={isHoveredAt(cell.row, cell.col)}
							onHover={onTileHover}
							neighbors={neighbors}
							hoverNeighbors={hoverNeighbors}
						/>
					)
				})
			)}
		</div>
	)
}

export default Board
