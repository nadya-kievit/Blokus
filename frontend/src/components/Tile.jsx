function Tile({ value, row, col, onClick, onHover, isHovered, isHoverValid, neighbors, hoverNeighbors }) {

	const handleClick = () => {
		onClick(row, col)
	}

	const isOccupied = value.occupied

	const topOccupied = neighbors.top?.occupied
	const bottomOccupied = neighbors.bottom?.occupied
	const leftOccupied = neighbors.left?.occupied
	const rightOccupied = neighbors.right?.occupied

	const shouldRemoveTopBorder = (isOccupied && topOccupied) || (isHovered && hoverNeighbors?.top)
	const shouldRemoveBottomBorder = (isOccupied && bottomOccupied) || (isHovered && hoverNeighbors?.bottom)
	const shouldRemoveLeftBorder = (isOccupied && leftOccupied) || (isHovered && hoverNeighbors?.left)
	const shouldRemoveRightBorder = (isOccupied && rightOccupied) || (isHovered && hoverNeighbors?.right)

	return (
		<div
			className={`tile ${isOccupied || isHovered ? 'glass-piece-tile' : ''}`}
			onClick={handleClick}
			onMouseEnter={() => onHover(row, col)}
			style={{
				background:
					isHovered
						? (isHoverValid
							? 'linear-gradient(145deg, rgba(130, 255, 180, 0.9), rgba(30, 225, 110, 0.8))'
							: 'linear-gradient(145deg, rgba(255, 95, 95, 0.95), rgba(210, 0, 0, 0.85))')
						: isOccupied
							? 'linear-gradient(145deg, #1f9dff 0%, #0077ee 100%)'
							: 'rgba(245, 252, 255, 0.88)',

				borderTop: shouldRemoveTopBorder
					? '1px solid rgba(35, 70, 95, 0.5)'
					: '1px solid rgba(35, 70, 95, 0.75)',

				borderBottom: shouldRemoveBottomBorder
					? '1px solid rgba(35, 70, 95, 0.5)'
					: '1px solid rgba(35, 70, 95, 0.75)',

				borderLeft: shouldRemoveLeftBorder
					? '1px solid rgba(35, 70, 95, 0.5)'
					: '1px solid rgba(35, 70, 95, 0.75)',

				borderRight: shouldRemoveRightBorder
					? '1px solid rgba(35, 70, 95, 0.5)'
					: '1px solid rgba(35, 70, 95, 0.75)',
			}}
		/>
	)
}

export default Tile