import clsx from 'clsx'
import { getPlayerColorHex } from '../playerColors'

function Tile({
	value,
	row,
	col,
	viewRow,
	viewCol,
	onClick,
	onHover,
	isHovered,
	neighbors,
	hoverNeighbors,
	startPlayer,
	isOwnStart,
}) {

	const isOccupied = value.occupied
	const isPlayable = value.playable !== false
	const occupiedColor = getPlayerColorHex(value.color)
	const startColor = startPlayer ? getPlayerColorHex(startPlayer.color) : null
	const handleClick = () => {
		if (isPlayable) onClick(row, col, viewRow, viewCol)
	}
	const belongsToSamePiece = neighbor => isOccupied && value.pieceId && neighbor?.pieceId === value.pieceId

	const shouldRemoveTopBorder = belongsToSamePiece(neighbors.top) || (isHovered && hoverNeighbors?.top)
	const shouldRemoveBottomBorder = belongsToSamePiece(neighbors.bottom) || (isHovered && hoverNeighbors?.bottom)
	const shouldRemoveLeftBorder = belongsToSamePiece(neighbors.left) || (isHovered && hoverNeighbors?.left)
	const shouldRemoveRightBorder = belongsToSamePiece(neighbors.right) || (isHovered && hoverNeighbors?.right)
	const mergedBorderColor = isHovered ? 'rgba(169, 108, 255, 0.48)' : null
	const defaultBorderColor = 'rgba(111, 101, 139, 0.62)'
	const outerBorderWidth = 1
	const innerBorderWidth = isHovered ? 0 : 1


	return (
		<div
			className={clsx(
				'tile',
				!isPlayable && 'tileNonPlayable',
				isOccupied && 'glassPieceTile',
				startPlayer && 'startingTile',
				isOwnStart && 'ownStartingTile',
			)}
			onClick={handleClick}
			onPointerEnter={event => {
				if (!isPlayable) return
				onHover(
					row,
					col,
					viewRow,
					viewCol,
					event.nativeEvent.offsetX / event.currentTarget.clientWidth,
					event.nativeEvent.offsetY / event.currentTarget.clientHeight,
				)
			}}
			aria-label={startPlayer ? `${startPlayer.name}'s starting square` : undefined}

			style={{
				'--piece-color': occupiedColor,
				'--start-color': startColor,
				background:
					isHovered
						? 'rgba(127, 82, 196, 0.62)'
						: isOccupied
							? `
								linear-gradient(
									145deg,
									color-mix(in srgb, ${occupiedColor}, white 24%) 0%,
									${occupiedColor} 48%,
									color-mix(in srgb, ${occupiedColor}, black 16%) 100%
								)
							`
							: 'rgba(21, 17, 34, 0.96)',

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
		>
			{startPlayer && <span className="startPositionMarker" aria-hidden="true" />}
		</div>
	)
}

export default Tile
