import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(() => ({
	bagButton: {
		border: 'none',
		background: 'transparent',
		padding: 0,
		cursor: 'pointer',
		transition: 'transform 140ms ease, filter 140ms ease',

		'&:hover': {
			transform: 'translateY(-4px) rotate(-1deg)',
			filter: 'drop-shadow(0 12px 18px rgba(0, 0, 0, 0.22))',
		},

		'&:disabled': {
			cursor: 'not-allowed',
			opacity: 0.55,
			transform: 'none',
			filter: 'none',
		},
	},
}))

function PieceBagButton({
	name,
	color,
	size = 170,
	disabled = false,
	onClick,
}) {
	const { classes } = useStyles()

	const gridCells = []

	const columns = 10
	const rows = 14
	const cellSize = 12
	const gap = 2
	const startX = 22
	const startY = 20

	const blankCells = new Set([
		'1-1', '1-2',
		'2-1', '2-2',

		'3-7', '3-8',
		'4-7', '4-8',

		'6-0', '6-1',
		'7-0', '7-1',

		'8-8', '8-9',
		'9-8', '9-9',

		'11-2', '11-3',
		'12-2', '12-3',
	])

	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < columns; col += 1) {
			const key = `${row}-${col}`

			gridCells.push({
				key,
				x: startX + col * (cellSize + gap),
				y: startY + row * (cellSize + gap),
				isBlank: blankCells.has(key),
			})
		}
	}

	return (
		<button
			type="button"
			className={classes.bagButton}
			disabled={disabled}
			onClick={onClick}
			aria-label={`Choose ${name}`}
		>
			<svg
				width={size}
				height={size * 1.3}
				viewBox="0 0 180 235"
				role="img"
				aria-hidden="true"
			>
				<defs>
					<clipPath id={`bag-shape-${name}`}>
						<path d="
							M20 12
							C42 8, 66 13, 88 10
							C116 6, 142 10, 162 15
							L166 222
							C130 226, 96 219, 62 224
							C42 227, 26 223, 15 218
							L18 150
							C10 130, 15 107, 18 86
							Z
						" />
					</clipPath>

					<linearGradient id={`bag-bg-${name}`} x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#eefbea" />
						<stop offset="45%" stopColor="#d8f5d2" />
						<stop offset="100%" stopColor="#f4fff1" />
					</linearGradient>

					<linearGradient id={`shine-${name}`} x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="white" stopOpacity="0" />
						<stop offset="50%" stopColor="white" stopOpacity="0.45" />
						<stop offset="100%" stopColor="white" stopOpacity="0" />
					</linearGradient>
				</defs>

				<g clipPath={`url(#bag-shape-${name})`}>
					<rect width="180" height="235" fill={`url(#bag-bg-${name})`} />

					{gridCells.map(cell => (
						<rect
							key={cell.key}
							x={cell.x}
							y={cell.y}
							width={cellSize}
							height={cellSize}
							rx="1.5"
							fill={cell.isBlank ? '#dff4d9' : color}
							opacity={cell.isBlank ? 0.75 : 1}
						/>
					))}

					<rect
						x="78"
						y="-20"
						width="24"
						height="280"
						fill={`url(#shine-${name})`}
						opacity="0.45"
						transform="rotate(8 90 117)"
					/>

					<path
						d="M42 30 C50 70, 34 95, 46 132 C54 158, 42 180, 50 218"
						fill="none"
						stroke="rgba(255,255,255,0.42)"
						strokeWidth="3"
					/>

					<path
						d="M138 16 C132 58, 150 84, 138 124 C130 153, 148 184, 140 226"
						fill="none"
						stroke="rgba(0,0,0,0.08)"
						strokeWidth="3"
					/>

					<text
						x="90"
						y="130"
						textAnchor="middle"
						dominantBaseline="middle"
						transform="rotate(-90 90 130)"
						fontFamily="Arial Black, Impact, sans-serif"
						fontSize="43"
						fill="white"
						stroke={color}
						strokeWidth="5"
						paintOrder="stroke"
						letterSpacing="1"
					>
						Blokus
					</text>

					<path
						d="M20 12
						C42 8, 66 13, 88 10
						C116 6, 142 10, 162 15
						L166 222
						C130 226, 96 219, 62 224
						C42 227, 26 223, 15 218
						L18 150
						C10 130, 15 107, 18 86
						Z"
						fill="none"
						stroke="rgba(255,255,255,0.65)"
						strokeWidth="2"
					/>
				</g>
			</svg>
		</button>
	)
}

export default PieceBagButton