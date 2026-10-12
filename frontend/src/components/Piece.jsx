import clsx from 'clsx'
import { getPlayerColorHex } from '../playerColors'

function Piece({ piece, isWaitingForPlayers, placed, isSelected, isPlayable = true, disabled = false, onClick, rotation, flipped, color, displaySize, cellSize = 10, bare = false }) {
	const isInteractive = !isWaitingForPlayers && !placed && isPlayable && !disabled
    const ability = !placed ? piece.ability : null
    const abilityTooltip = ability === 'scout'
        ? 'Scout: Place anywhere without sharing edges with your own pieces. Your first piece must cover your starting square.'
        : ability === 'connector'
            ? 'Connector: Must touch your own pieces along an edge or corner. Your first piece must cover your starting square.'
            : undefined

    const size = cellSize
    const cardSize = displaySize || 72
    const activeColor = getPlayerColorHex(color)
    const innerBorder = '1px solid rgba(0, 45, 120, 0.75)'
    const outerBorder = '1px solid rgba(0, 45, 120, 0.75)'

    const rotatedCells = piece.cells.map(([row, col]) => {
        const transformedCol = flipped ? -col : col

        switch (rotation) {

            case 90:
                return [-transformedCol, row]

            case 180:
                return [-row, -transformedCol]

            case 270:
                return [transformedCol, -row]

            default:
                return [row, transformedCol]
        }
    })

    const cellKeys = new Set(rotatedCells.map(([row, col]) => `${row},${col}`))

    const minRow = Math.min(...rotatedCells.map(c => c[0]))
    const minCol = Math.min(...rotatedCells.map(c => c[1]))
    const maxRow = Math.max(...rotatedCells.map(c => c[0]))
    const maxCol = Math.max(...rotatedCells.map(c => c[1]))
    const pieceHeight = (maxRow - minRow + 1) * size
    const pieceWidth = (maxCol - minCol + 1) * size
    const offsetTop = (cardSize - pieceHeight) / 2
    const offsetLeft = (cardSize - pieceWidth) / 2

    function bordersForCell(cell, cellKeys, innerBorder, outerBorder) {
        const [row, col] = cell
        const hasCell = (rowOffset, colOffset) =>
            cellKeys.has(`${row + rowOffset},${col + colOffset}`)

        return {
            borderTop: hasCell(-1, 0) ? innerBorder : outerBorder,
            borderBottom: hasCell(1, 0) ? innerBorder : outerBorder,
            borderLeft: hasCell(0, -1) ? innerBorder : outerBorder,
            borderRight: hasCell(0, 1) ? innerBorder : outerBorder,
        }
    }

    return (
        <div
            className={clsx(
                isInteractive ? 'pieceCard' : 'pieceCardNoHover',
                bare && 'pieceCardBare',
                placed && 'placed',
                isSelected && isInteractive && 'selected',
            )}
            onClick={isInteractive ? onClick : undefined}
            title={abilityTooltip}
            aria-label={abilityTooltip ? `${piece.name}. ${abilityTooltip}` : undefined}
            style={displaySize ? { width: displaySize, height: displaySize } : undefined}
        >

        {abilityTooltip && (
            <span className="specialPieceIndicator" aria-hidden="true">
                {ability === 'scout' ? 'S' : 'C'}
            </span>
        )}

        {rotatedCells.map((cell, index) => {

            const row = cell[0] - minRow
            const col = cell[1] - minCol

            return (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        boxSizing: 'border-box',
                        width: `${size}px`,
                        height: `${size}px`,

                        top: `${offsetTop + row * size}px`,
                        left: `${offsetLeft + col * size}px`,

                        background: placed
                            ? 'linear-gradient(145deg, #b8b8b8, #777)'
                            : isSelected
                                ? `linear-gradient(145deg, #ffffff 0%, ${activeColor} 55%, ${activeColor} 100%)`
                                : `${activeColor}`,

                        
                        opacity: !isPlayable ? 0.6 : placed ? 0.6 : 1,
						filter: !isPlayable ? 'saturate(0.5)' : 'none',
						cursor: isInteractive ? 'pointer' : 'default',
						transition: 'top 160ms ease-out, left 160ms ease-out, opacity 180ms ease, filter 180ms ease',
                        ...bordersForCell(cell, cellKeys, innerBorder, outerBorder),
                        borderRadius: '1px',
                    }}
                />
            )
        })}

    </div>
    )
}

export default Piece
