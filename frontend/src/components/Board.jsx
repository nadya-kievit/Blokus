import Tile from './Tile'

function Board({ board, onTileClick, onTileHover, hoverCells, isHoverValid }) {

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
                        isHoverValid={isHoverValid}
                        onHover={onTileHover}
                    />
                ))
            )}

        </div>
    )
}

export default Board