import clsx from 'clsx'
import { makeStyles } from 'tss-react/mui'
import gameStyles from '../gameStyles'
import { getPlayerColorHex } from '../playerColors'

const useStyles = makeStyles()(gameStyles)

function Piece({ piece, isWaitingForPlayers, placed, isSelected, isPlayable = true, disabled = false, onClick, rotation, flipped, color, displaySize }) {
	const { classes } = useStyles()
	const isInteractive = !isWaitingForPlayers && !placed && isPlayable && !disabled

    const size = 13
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
                isInteractive ? classes.pieceCard : classes.pieceCardNoHover,
                placed && classes.placed,
                isSelected && isInteractive && classes.selected,
            )}
            onClick={isInteractive ? onClick : undefined}
            style={displaySize ? { width: displaySize, height: displaySize } : undefined}
        >

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
