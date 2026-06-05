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
                    className={`piece-tile ${placed ? 'piece-tile-placed' : 'piece-tile-active'}`}
                    style={{
                        position: 'absolute',
                        width: `${size}px`,
                        height: `${size}px`,

                        top: `${row * size}px`,
                        left: `${col * size}px`,

                        background: placed
                            ? 'linear-gradient(145deg, #b8b8b8, #777)'
                            : isSelected
                                ? 'linear-gradient(145deg, #8ee8ff 0%, #20a8ff 55%, #006ee6 100%)'
                                : 'linear-gradient(145deg, #45b6ff 0%, #006ee6 60%, #0047a8 100%)',

                        boxShadow: placed
                            ? 'inset 2px 2px 4px rgba(255,255,255,0.35), inset -2px -2px 4px rgba(0,0,0,0.25)'
                            : 'inset 2px 2px 4px rgba(255,255,255,0.55), inset -2px -2px 4px rgba(0,40,120,0.4), 0 2px 4px rgba(0,0,0,0.22)',

                        opacity: placed ? 0.6 : 1,
                        cursor: placed ? 'default' : 'pointer',
                        border: '1px solid rgba(0, 45, 120, 0.75)',
                        borderRadius: '4px',
                    }}
                />
            )
        })}

    </div>
    )
}

export default Piece