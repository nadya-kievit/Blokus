import clsx from 'clsx'

function Tile({
	value,
	row,
	col,
	viewRow,
	viewCol,
	onClick,
	onHover,
	isHovered,
	isHoverValid,
	neighbors,
	hoverNeighbors,
	classes,
}) {

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
	const hoverBorderColor = isHoverValid
		? 'rgba(14, 176, 65, 0.95)'
		: 'rgba(224, 35, 39, 0.95)'
	const hoverGlowColor = isHoverValid
		? 'rgba(31, 224, 94, 0.42)'
		: 'rgba(255, 59, 67, 0.42)'
	const hoverInsetGlowColor = isHoverValid
		? 'rgba(72, 255, 135, 0.18)'
		: 'rgba(255, 94, 102, 0.18)'
	const mergedBorderColor = isHovered
		? 'rgba(84, 99, 108, 0.32)'
		: 'rgba(35, 70, 95, 0.5)'
	const defaultBorderColor = isHovered
		? hoverBorderColor
		: 'rgba(35, 70, 95, 0.75)'
	const outerBorderWidth = 1
	const innerBorderWidth = isHovered ? 0 : 1
	const hoverBoxShadow = isHovered
		? `
			0 0 0 1px ${hoverBorderColor},
			0 0 12px 3px ${hoverGlowColor},
			inset 0 0 12px ${hoverInsetGlowColor},
			inset 1px 1px 3px rgba(255, 255, 255, 0.62),
			inset -1px -1px 4px rgba(60, 76, 88, 0.22)
		`
		: undefined

	return (
		<div
			className={clsx(classes.tile, (isOccupied || isHovered) && classes.glassPieceTile)}
			onClick={handleClick}
			onMouseEnter={() => onHover(row, col, viewRow, viewCol)}
			style={{
				background:
					isHovered
						? 'linear-gradient(145deg, rgba(246, 249, 251, 0.88), rgba(156, 168, 177, 0.72))'
						: isOccupied
							? `linear-gradient(145deg, #ffffff 0%, ${occupiedColor} 52%, ${occupiedColor} 100%)`
							: 'rgba(245, 252, 255, 0.88)',
				boxShadow: hoverBoxShadow,
				zIndex: isHovered ? 2 : 'auto',

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
