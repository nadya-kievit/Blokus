import clsx from 'clsx'

function Tile({value, row, col, viewRow, viewCol, onClick, onHover, isHovered, neighbors, hoverNeighbors, classes}) {

	const handleClick = () => {
		onClick(row, col, viewRow, viewCol)
	}

	const isOccupied = value.occupied
	const occupiedColor = value.color || '#0077ee'

	const belongsToSamePiece = neighbor =>
		isOccupied && value.pieceId && neighbor?.pieceId === value.pieceId

	const shouldRemoveTopBorder = belongsToSamePiece(neighbors.top) || (isHovered && hoverNeighbors?.top)
	const shouldRemoveBottomBorder = belongsToSamePiece(neighbors.bottom) || (isHovered && hoverNeighbors?.bottom)
	const shouldRemoveLeftBorder = belongsToSamePiece(neighbors.left) || (isHovered && hoverNeighbors?.left)
	const shouldRemoveRightBorder = belongsToSamePiece(neighbors.right) || (isHovered && hoverNeighbors?.right)
	const mergedBorderColor = isHovered ? 'rgba(156, 168, 177, 0.72)' : null
	const defaultBorderColor = 'rgba(35, 70, 95, 0.75)'
	const outerBorderWidth = 1
	const innerBorderWidth = isHovered ? 0 : 1

	return (
		<div
			className={clsx(classes.tile, (isOccupied) && classes.glassPieceTile)}
			onClick={handleClick}
			onPointerEnter={event => onHover(
				row,
				col,
				viewRow,
				viewCol,
				event.nativeEvent.offsetX / event.currentTarget.clientWidth,
				event.nativeEvent.offsetY / event.currentTarget.clientHeight
			)}
			style={{
				background:
					isHovered
						? 'rgba(156, 168, 177, 0.72)'
						: isOccupied
							? `linear-gradient(145deg, #ffffff 0%, ${occupiedColor} 52%, ${occupiedColor} 100%)`
							: 'rgba(245, 252, 255, 0.88)',

				borderTop: shouldRemoveTopBorder
					? `${innerBorderWidth}px solid ${mergedBorderColor}`
					: `${outerBorderWidth}px solid ${defaultBorderColor}`,

				borderBottom: shouldRemoveBottomBorder
					? `${innerBorderWidth}px solid ${mergedBorderColor}`
					: `${outerBorderWidth}px solid ${defaultBorderColor}`,

				borderLeft: shouldRemoveLeftBorder
					? `${innerBorderWidth}px solid ${mergedBorderColor}`
					: `${outerBorderWidth}px solid ${defaultBorderColor}`,

				borderRight: shouldRemoveRightBorder
					? `${innerBorderWidth}px solid ${mergedBorderColor}`
					: `${outerBorderWidth}px solid ${defaultBorderColor}`,
			}}
		/>
	)
}

export default Tile
