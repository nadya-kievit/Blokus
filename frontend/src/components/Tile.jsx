function Tile({ value, row, col, onClick, onHover, isHovered }) {

  const handleClick = () => {
    onClick(row, col)
  }

  return (
    <div
      className="tile"
      onClick={handleClick}
      onMouseEnter={() => onHover(row, col)}
      style={{
        backgroundColor:
          isHovered
            ? 'rgba(173,216,230,0.5)'
            : value.occupied
              ? 'blue'
              : 'white',
      }}
    />
  )
}

export default Tile