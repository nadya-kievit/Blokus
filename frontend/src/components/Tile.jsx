import clsx from 'clsx'

function Tile({value, row, col, viewRow, viewCol, onClick, onHover, isHovered, neighbors, hoverNeighbors, classes}) {

	const handleClick = () => {
		onClick(row, col, viewRow, viewCol)
	}

	const isOccupied = value.occupied
	const occupiedColor = value.color || '#0077ee'

	const topOccupied = neighbors.top?.occupied
	const bottomOccupied = neighbors.bottom?.occupied
	const leftOccupied = neighbors.left?.occupied
	const rightOccupied = neighbors.right?.occupied

	const shouldRemoveTopBorder = (isOccupied && topOccupied) || (isHovered && hoverNeighbors?.top)
	const shouldRemoveBottomBorder = (isOccupied && bottomOccupied) || (isHovered && hoverNeighbors?.bottom)
	const shouldRemoveLeftBorder = (isOccupied && leftOccupied) || (isHovered && hoverNeighbors?.left)
	const shouldRemoveRightBorder = (isOccupied && rightOccupied) || (isHovered && hoverNeighbors?.right)
	const hoverInsetGlowColor = 'rgba(72, 255, 135, 0.18)'
	const mergedBorderColor = isHovered ? 'rgba(156, 168, 177, 0.72)' : 'rgba(35, 70, 95, 0.5)'
	const defaultBorderColor = 'rgba(35, 70, 95, 0.75)'
	const outerBorderWidth = 1
	const innerBorderWidth = isHovered ? 0 : 1

	return (
		<div
			className={clsx(classes.tile, (isOccupied || isHovered) && classes.glassPieceTile)}
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
