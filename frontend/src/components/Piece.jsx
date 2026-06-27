import clsx from 'clsx'

function Piece({ piece, placed, isSelected, onClick, rotation, color, classes }) {

    const size = 13
    const cardSize = 72
    const activeColor = color || '#0077ee'

    const rotatedCells = piece.cells.map(([row, col]) => {

        switch (rotation) {

            case 90:
                return [-col, row]

            case 180:
                return [-row, -col]

            case 270:
                return [col, -row]

            default:
                return [row, col]
        }
    })

    const minRow = Math.min(...rotatedCells.map(c => c[0]))
    const minCol = Math.min(...rotatedCells.map(c => c[1]))
    const maxRow = Math.max(...rotatedCells.map(c => c[0]))
    const maxCol = Math.max(...rotatedCells.map(c => c[1]))
    const pieceHeight = (maxRow - minRow + 1) * size
    const pieceWidth = (maxCol - minCol + 1) * size
    const offsetTop = (cardSize - pieceHeight) / 2
    const offsetLeft = (cardSize - pieceWidth) / 2

    return (
        <div
			className={clsx(classes.pieceCard, placed && classes.placed, isSelected && classes.selected)}
            onClick={onClick}
        >

        {rotatedCells.map((cell, index) => {

            const row = cell[0] - minRow
            const col = cell[1] - minCol

            return (
                <div
                    key={index}
                    className={classes.pieceTile}
                    style={{
                        position: 'absolute',
                        width: `${size}px`,
                        height: `${size}px`,

                        top: `${offsetTop + row * size}px`,
                        left: `${offsetLeft + col * size}px`,

                        background: placed
                            ? 'linear-gradient(145deg, #b8b8b8, #777)'
                            : isSelected
                                ? `linear-gradient(145deg, #ffffff 0%, ${activeColor} 55%, ${activeColor} 100%)`
                                : `linear-gradient(145deg, #ffffff 0%, ${activeColor} 55%, ${activeColor} 100%)`,

                        boxShadow: placed
                            ? 'inset 2px 2px 4px rgba(255,255,255,0.35), inset -2px -2px 4px rgba(0,0,0,0.25)'
                            : 'inset 2px 2px 4px rgba(255,255,255,0.55), inset -2px -2px 4px rgba(0,40,120,0.4), 0 2px 4px rgba(0,0,0,0.22)',

                        opacity: placed ? 0.6 : 1,
                        cursor: placed ? 'default' : 'pointer',
                        border: '1px solid rgba(0, 45, 120, 0.75)',
                        borderRadius: '1px',
                    }}
                />
            )
        })}

    </div>
    )
}

export default Piece
