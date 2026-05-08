import Tile from './Tile'

function Board({ board, onTileClick, onTileHover, hoverCells }) {

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
                        isHovered={ hoverCells.some( cell => cell.row === rowIndex && cell.col === colIndex )}
                        onHover={onTileHover}
                    />
                ))
            )}

        </div>
    )
}

export default Board