import Tile from './Tile'

function Board({ board, onTileClick }) {

    return (
        <div className="board">

            {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <Tile
                        key={`${rowIndex}-${colIndex}`}
                        value={cell}
                        row={rowIndex}
                        col={colIndex}
                        onClick={onTileClick}
                    />
                ))
            )}

        </div>
    )
}

export default Board