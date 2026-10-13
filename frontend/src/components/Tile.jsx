import { getPlayerColorHex } from '../playerColors'
import { tileFinish } from '../game/piecePresentation'

function Tile({
	value, row, col, viewRow, viewCol, onClick, onHover, isHovered,
	startPlayer, isOwnStart, ability, preview, isLastMove, isPending,
}) {
	const playable = value.playable !== false
	const finish = isHovered
		? tileFinish(getPlayerColorHex(preview?.color), preview?.ability)
		: value.occupied ? tileFinish(getPlayerColorHex(value.color), ability, 'board', isLastMove)
			: { background: playable ? '#1F2230' : 'transparent', boxShadow: 'none' }
	if (startPlayer && !value.occupied && !isHovered) {
		const color = getPlayerColorHex(startPlayer.color)
		finish.background = `color-mix(in srgb, ${color} ${isOwnStart ? 22 : 16}%, transparent)`
		finish.boxShadow = isOwnStart
			? `inset 0 0 0 2px #EDEFF5, 0 0 0 3px color-mix(in srgb, ${color} 35%, transparent)`
			: 'none'
	}
	return (
		<div className={`tile${playable ? '' : ' tileNonPlayable'}${startPlayer && !value.occupied ? ' startingTile' : ''}${isOwnStart && !value.occupied ? ' ownStartingTile' : ''}`}
			data-row={row} data-col={col} data-piece-id={value.pieceId || undefined}
			data-ability={(isHovered ? preview?.ability : ability) || 'normal'} data-last-move={isLastMove || undefined}
			onClick={() => { if (playable) onClick(row, col, viewRow, viewCol) }}
			onPointerEnter={event => {
				if (!playable) return
				onHover(row, col, viewRow, viewCol,
					event.nativeEvent.offsetX / event.currentTarget.clientWidth,
					event.nativeEvent.offsetY / event.currentTarget.clientHeight)
			}}
			aria-label={startPlayer ? `${startPlayer.name}'s starting square` : undefined}
			style={{ ...finish, opacity: isHovered || isPending ? 0.6 : 1, '--start-color': startPlayer ? getPlayerColorHex(startPlayer.color) : undefined }}>
			{startPlayer && !isHovered && !value.occupied && <span className="startPositionMarker" aria-hidden="true" />}
		</div>
	)
}

export default Tile
