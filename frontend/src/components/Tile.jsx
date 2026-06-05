function Tile({ value, row, col, onClick, onHover, isHovered, isHoverValid }) {

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
						? (isHoverValid ? 'rgba(39, 174, 96, 0.65)' : 'rgba(255, 0, 0, 0.75)')
						: value.occupied
							? 'blue'
							: 'white'
			}}
		/>
	)
}

export default Tile