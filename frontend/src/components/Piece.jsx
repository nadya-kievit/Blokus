import clsx from 'clsx'

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

export function CursorPiece({ piece, rotation, flipped, color, cursorRef, position, classes }) {
    const size = 35
    const activeColor = color || '#0077ee'
    const innerBorder = '1px solid transparent'
    const outerBorder = '1px solid rgba(111, 101, 139, 0.62)'
    const rotatedCells = piece.cells.map(([row, col]) => {
        const transformedCol = flipped ? -col : col

        switch (rotation) {
            case 90: return [-transformedCol, row]
            case 180: return [-row, -transformedCol]
            case 270: return [transformedCol, -row]
            default: return [row, transformedCol]
        }
    })
    const cellKeys = new Set(rotatedCells.map(([row, col]) => `${row},${col}`))
    const minRow = Math.min(...rotatedCells.map(cell => cell[0]))
    const minCol = Math.min(...rotatedCells.map(cell => cell[1]))
    const width = (Math.max(...rotatedCells.map(cell => cell[1])) - minCol + 1) * size
    const height = (Math.max(...rotatedCells.map(cell => cell[0])) - minRow + 1) * size

    return (
        <div
            ref={cursorRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width,
                height,
                zIndex: 1000,
                pointerEvents: 'none',
                willChange: 'transform',
                transform: `translate3d(${position.x - width / 2}px, ${position.y - height / 2}px, 0)`,
            }}
        >
            {rotatedCells.map((cell, index) => (
                <div
                    key={index}
                    className={classes.glassPieceTile}
                    style={{
                        position: 'absolute',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        width: size,
                        height: size,
                        top: (cell[0] - minRow) * size,
                        left: (cell[1] - minCol) * size,
                        '--piece-color': activeColor,
                        background: `
                            linear-gradient(
                                145deg,
                                color-mix(in srgb, ${activeColor}, white 24%) 0%,
                                ${activeColor} 48%,
                                color-mix(in srgb, ${activeColor}, black 16%) 100%
                            )
                        `,
                        ...bordersForCell(cell, cellKeys, innerBorder, outerBorder),
                        borderRadius: 2,
                    }}
                />
            ))}
        </div>
    )
}

function Piece({ piece, placed, isSelected, onClick, rotation, flipped, color, classes }) {

    const size = 13
    const cardSize = 72
    const activeColor = color || '#0077ee'
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

    return (
        <div className={clsx(classes.pieceCard, placed && classes.placed, isSelected && classes.selected)} onClick={onClick}>

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

                        
                        opacity: placed ? 0.6 : 1,
                        cursor: placed ? 'default' : 'pointer',
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
