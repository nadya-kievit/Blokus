function Piece({ piece, isSelected, onClick, rotation }) {

    const size = 15

    return (
        <div
            onClick={onClick}
            style={{
                position: 'relative',
                width: '120px',
                height: '80px',

                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center'
            }}
        >

        {piece.cells.map((cell, index) => {

            const row = cell[0]
            const col = cell[1]

            return (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        width: `${size}px`,
                        height: `${size}px`,

                        top: `${row * size}px`,
                        left: `${col * size}px`,

                        backgroundColor: isSelected
                            ? 'lightblue'
                            : 'blue',

                        border: '1px solid black',
                    }}
                />
            )
        })}

    </div>
    )
}

export default Piece