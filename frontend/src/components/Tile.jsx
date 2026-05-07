function Tile({ value, row, col, onClick }) {

  const handleClick = () => {
    onClick(row, col)
  }

  return (
    <div className="tile" onClick={handleClick}>
      {value}
    </div>
  )
}

export default Tile