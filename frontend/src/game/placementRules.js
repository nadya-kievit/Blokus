export function isValidPlacement(board, cells, player, isFirstMove, players, ability) {
	const boardHeight = board.length
	const boardWidth = board[0]?.length || 0
	if (!cells.length || cells.some(cell =>
		cell.row < 0 || cell.row >= boardHeight ||
		cell.col < 0 || cell.col >= boardWidth ||
		board[cell.row][cell.col].playable === false ||
		board[cell.row][cell.col].occupied
	)) return false

	const reservedStarts = new Set(
		players
			.filter(otherPlayer =>
				otherPlayer.id !== player.id &&
				otherPlayer.startPosition &&
				!otherPlayer.pieces.some(piece => piece.placed)
			)
			.map(otherPlayer =>
				`${otherPlayer.startPosition.row},${otherPlayer.startPosition.col}`
			)
	)
	if (cells.some(cell => reservedStarts.has(`${cell.row},${cell.col}`))) return false

	if (isFirstMove) {
		const startPosition = player.startPosition || player.corner
		return cells.some(cell =>
			cell.row === startPosition?.row && cell.col === startPosition?.col
		)
	}

	let touchesOwnPieceDiagonally = false
	let touchesOwnPieceAlongEdge = false

	for (const cell of cells) {
		const sideNeighbors = [
			[cell.row - 1, cell.col],
			[cell.row + 1, cell.col],
			[cell.row, cell.col - 1],
			[cell.row, cell.col + 1],
		]

		if (sideNeighbors.some(([row, col]) =>
			row >= 0 && row < boardHeight &&
			col >= 0 && col < boardWidth &&
			board[row][col].player === player.id
		)) {
			touchesOwnPieceAlongEdge = true
			if (ability !== 'connector') return false
		}

		const diagonalNeighbors = [
			[cell.row - 1, cell.col - 1],
			[cell.row - 1, cell.col + 1],
			[cell.row + 1, cell.col - 1],
			[cell.row + 1, cell.col + 1],
		]

		if (diagonalNeighbors.some(([row, col]) =>
			row >= 0 && row < boardHeight &&
			col >= 0 && col < boardWidth &&
			board[row][col].player === player.id
		)) touchesOwnPieceDiagonally = true
	}

	if (ability === 'scout') return true
	if (ability === 'connector') return touchesOwnPieceAlongEdge || touchesOwnPieceDiagonally
	return touchesOwnPieceDiagonally
}
