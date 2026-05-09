function Piece({ piece, placed, isSelected, onClick, rotation }) {

    const size = 15

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

    return (
        <div
            onClick={onClick}
            style={{
                position: 'relative',
                width: '120px',
                height: '80px'
            }}
        >

        {rotatedCells.map((cell, index) => {

            const row = cell[0] - minRow
            const col = cell[1] - minCol

            return (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        width: `${size}px`,
                        height: `${size}px`,

                        top: `${row * size}px`,
                        left: `${col * size}px`,

                        backgroundColor: placed
                            ? 'gray'
                            : isSelected
                                ? 'lightblue'
                                : 'blue',

                        opacity: placed ? 0.5 : 1,
                        cursor: placed ? 'default' : 'pointer',
                        border: '1px solid black',
                    }}
                />
            )
        })}

    </div>
    )
}

export default Piece