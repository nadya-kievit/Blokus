export const globalGameStyles = {
	html: {
			margin: 0,
			minHeight: '100%',
			width: '100%',
			overflowX: 'hidden',
			colorScheme: 'light',
		},

		body: {
			margin: 0,
			minHeight: '100vh',
			width: '100%',
			overflowX: 'hidden',
			background: `
				radial-gradient(circle at top left, rgba(255, 255, 255, 0.65), transparent 34%),
				radial-gradient(circle at top right, rgba(255, 255, 255, 0.38), transparent 30%),
				linear-gradient(135deg, #eefaff 0%, #d7edf8 42%, #bdddf0 100%)
			`,
			fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		},

		'#root': {
			margin: 0,
			minHeight: '100vh',
			width: '100%',
			maxWidth: 'none',
			overflowX: 'hidden',
			border: 0,
			boxSizing: 'border-box',
		},

		button: {
			border: '1px solid rgba(23, 73, 107, 0.35)',
			borderRadius: 8,
			padding: '10px 14px',
			background: 'linear-gradient(145deg, #ffffff, #d7edf8)',
			color: '#17496b',
			fontWeight: 750,
			cursor: 'pointer',
			boxShadow: '0 4px 10px rgba(35, 72, 100, 0.16)',
		},

		'button:disabled': {
			cursor: 'not-allowed',
			opacity: 0.55,
		},
}

const gameStyles = () => ({

	gamePage: {
		minHeight: '100vh',
		width: '100%',
		boxSizing: 'border-box',
		padding: '14px 17px 24px',
		display: 'flex',
		flexDirection: 'column',
		gap: 18,
		overflow: 'hidden',
		position: 'relative',
	},

	gameMain: {
		flex: 1,
		minHeight: 0,
		width: '100%',
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	boardCenter: {
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
	},

	piecesRight: {
		position: 'absolute',
		right: 32,
		top: '50%',
		transform: 'translateY(-50%)',

		boxSizing: 'border-box',
		width: 430,
		height: '100%',
		maxHeight: 760,
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		padding: '20px 18px 17px',
		border: '1px solid rgba(255, 255, 255, 0.9)',
		borderRadius: 14,
		background: `
			linear-gradient(
			145deg,
			rgba(250, 254, 255, 0.92),
			rgba(235, 247, 253, 0.88)
			)
		`,
		boxShadow: '0 13px 30px rgba(67, 124, 163, 0.17)',
		backdropFilter: 'blur(12px)',
		WebkitBackdropFilter: 'blur(12px)',
	},

	startPage: {
		minHeight: '100vh',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 24,
	},

	startPanel: {
		width: '750px',
		padding: 28,
		boxSizing: 'border-box',
		borderRadius: 10,
		background: 'rgba(255, 255, 255, 0.64)',
		border: '2px solid rgba(255, 255, 255, 0.8)',
		boxShadow: '0 14px 28px rgba(35, 72, 100, 0.22)',
		backdropFilter: 'blur(8px)',
		WebkitBackdropFilter: 'blur(8px)',
		textAlign: 'center',

		'& h2': {
			margin: '0 0 10px',
			color: '#17496b',
			fontSize: 24,
			fontWeight: 750,
		},

		'& p': {
			margin: '0 0 22px',
			color: '#35657f',
			fontSize: 15,
			lineHeight: 1.45,
		},
	},

	startDivider: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		margin: '20px 0',
		color: '#66859a',

		'&::before, &::after': {
			content: '""',
			flex: 1,
			height: 1,
			background: 'rgba(23, 73, 107, 0.2)',
		},
	},

	joinForm: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 11,

		'& button': {
			alignSelf: 'stretch',
			minWidth: 104,
		},
	},

	codeInputGroup: {
		display: 'grid',
		gridTemplateColumns: 'repeat(6, 46px)',
		gap: 8,

		'& input': {
			width: 46,
			height: 58,
			boxSizing: 'border-box',
			border: '1px solid rgba(114, 143, 162, 0.28)',
			borderRadius: 7,
			padding: 0,
			background: 'rgba(255, 255, 255, 0.78)',
			color: '#123f61',
			font: 'inherit',
			fontSize: 24,
			fontWeight: 850,
			lineHeight: 1,
			textAlign: 'center',
			boxShadow: `
				inset 0 1px 2px rgba(255, 255, 255, 0.85),
				0 4px 10px rgba(35, 72, 100, 0.09)
			`,
			outline: 'none',
			transition: 'border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease',

			'&:focus': {
				borderColor: 'rgba(46, 105, 220, 0.55)',
				boxShadow: `
					0 0 0 3px rgba(46, 105, 220, 0.13),
					0 6px 13px rgba(35, 72, 100, 0.13)
				`,
				transform: 'translateY(-1px)',
			},
		},
	},

	inviteLabel: {
		color: '#66859a',
		fontSize: 12,
		fontWeight: 750,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},

	inviteCode: {
		margin: '2px 0 22px',
		color: '#17496b',
		fontSize: 34,
		fontWeight: 850,
		letterSpacing: 7,
	},

	colorOptions: {
		display: 'flex',
		flexDirection: 'row',
		gap: 16,
		marginBottom: 18,
		justifyContent: 'center',
		alignItems: 'center',
		flexWrap: 'nowrap',
	},

	textButton: {
		background: 'transparent',
		boxShadow: 'none',
	},

	gameHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 24,
		boxSizing: 'border-box',
		width: '100%',
		minHeight: 68,
		padding: '10px 12px 10px 21px',
		border: '1px solid rgba(255, 255, 255, 0.82)',
		borderRadius: 11,
		background: `
			linear-gradient(
				105deg,
				rgba(255, 255, 255, 0.88),
				rgba(238, 248, 255, 0.78)
			)
		`,
		boxShadow: '0 7px 18px rgba(65, 119, 157, 0.18)',
		backdropFilter: 'blur(12px)',
		WebkitBackdropFilter: 'blur(12px)',
		zIndex: 3,
	},

	gameBrand: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
	},

	gameTitle: {
		textAlign: 'center',
		margin: 0,
		color: '#17496b',
		fontSize: 42,
		letterSpacing: 1,
		textShadow: '0 2px 4px rgba(255, 255, 255, 0.7)',
	},

	gameHeaderTitle: {
		fontSize: 32,
		fontWeight: 850,
		lineHeight: 1,
		letterSpacing: 0.4,
		color: '#0d4a70',
		textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)',
	},

	connectionRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 6,
		marginTop: 5,
		color: '#46647a',
		fontSize: 11,
		fontWeight: 650,
		textTransform: 'capitalize',
	},

	connectionDot: {
		width: 9,
		height: 9,
		borderRadius: '50%',
		background: '#b7bec6',
		boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.8)',
	},

	connected: {
		background: '#25b564',
	},

	connecting: {
		background: '#f3b51b',
	},

	joining: {
		background: '#f3b51b',
	},

	disconnected: {
		background: '#e34242',
	},

	error: {
		background: '#e34242',
	},

	gameActions: {
		display: 'flex',
		alignItems: 'center',
		flexWrap: 'nowrap',
		justifyContent: 'flex-end',
		gap: 9,
	},

	headerCode: {
		display: 'flex',
		alignItems: 'center',
		gap: 7,
		padding: '0 7px',
		color: '#42647d',
		fontSize: 12,

		'& strong': {
			color: '#2e69dc',
			fontSize: 15,
			letterSpacing: 0.5,
		},
	},

	headerActionButton: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 7,
		minHeight: 34,
		padding: '8px 12px',
		borderColor: 'rgba(84, 122, 150, 0.15)',
		borderRadius: 7,
		background: 'rgba(255, 255, 255, 0.88)',
		boxShadow: '0 3px 8px rgba(42, 85, 116, 0.12)',
		fontSize: 12,

		'& svg': {
			width: 16,
			height: 16,
			fill: 'none',
			stroke: 'currentColor',
			strokeWidth: 1.8,
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
		},
	},

	copyButton: {
		color: '#294f6e',

		'& svg': {
			color: '#4079ed',
		},
	},

	dangerButton: {
		color: '#e5252a',
		borderColor: 'rgba(229, 37, 42, 0.12)',
		background: 'rgba(255, 255, 255, 0.9)',
	},

	playersBar: {
		position: 'absolute',
		top: 102,
		left: 28,
		right: 28,
		display: 'flex',
		flexWrap: 'wrap',
		gap: 10,
		zIndex: 2,
	},

	playerPill: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 8,
		minHeight: 34,
		padding: '0 12px',
		border: '2px solid rgba(255, 255, 255, 0.8)',
		borderRadius: 8,
		background: 'rgba(255, 255, 255, 0.64)',
		color: '#17496b',
		fontSize: 13,
		fontWeight: 750,
		boxShadow: '0 4px 10px rgba(35, 72, 100, 0.12)',
	},

	active: {
		background: 'rgba(255, 255, 255, 0.9)',
		boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.72), 0 8px 16px rgba(35, 72, 100, 0.2)',
	},
	empty: {
		color: '#66859a',
		borderColor: 'rgba(255, 255, 255, 0.8)',
	},

	playerColor: {
		width: 12,
		height: 12,
		borderRadius: '50%',
		boxShadow: `
			inset 0 1px 2px rgba(255, 255, 255, 0.8),
			inset 0 -1px 2px rgba(0, 0, 0, 0.2)
		`,
	},

	playerSeat: {
		color: '#66859a',
		fontSize: 11,
		fontWeight: 650,
	},

	lobbyBanner: {
		position: 'absolute',
		left: '50%',
		transform: 'translateX(-50%)',
		zIndex: 3,
		top: 152,
		padding: '9px 14px',
		borderRadius: 8,
		background: 'rgba(255, 255, 255, 0.76)',
		color: '#17496b',
		fontSize: 14,
		fontWeight: 750,
		boxShadow: '0 6px 14px rgba(35, 72, 100, 0.16)',
		backdropFilter: 'blur(8px)',
		WebkitBackdropFilter: 'blur(8px)',
	},

	turnBanner: {
		display: 'flex',
		alignItems: 'center',
		gap: 14,
		width: 215,
		maxWidth: 'calc(100vw - 48px)',
		boxSizing: 'border-box',
		padding: '12px 18px',
		border: '1px solid rgba(255, 255, 255, 0.88)',
		borderRadius: 14,
		background: 'rgba(255, 255, 255, 0.86)',
		color: '#123f61',
		boxShadow: '0 10px 24px rgba(65, 119, 157, 0.17)',
		backdropFilter: 'blur(12px)',
		WebkitBackdropFilter: 'blur(12px)',
	},

	turnAvatar: {
		flex: '0 0 auto',
		width: 38,
		height: 38,
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'var(--turn-color, #f3b51b)',
		boxShadow: `
			inset 0 2px 3px rgba(255, 255, 255, 0.5),
			inset 0 -3px 5px rgba(0, 0, 0, 0.12),
			0 4px 9px rgba(35, 72, 100, 0.16)
		`,

		'& svg': {
			width: 23,
			height: 23,
			fill: '#16405f',
			stroke: '#16405f',
			strokeWidth: 1.8,
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
		},
	},

	turnText: {
		minWidth: 0,
		textAlign: 'left',
	},

	turnTitle: {
		color: '#173f67',
		fontSize: 16,
		fontWeight: 850,
		lineHeight: 1.08,
	},

	turnSubtitle: {
		marginTop: 4,
		color: '#42647d',
		fontSize: 13,
		fontWeight: 700,
		lineHeight: 1.15,
	},

	statusMessage: {
		position: 'absolute',
		left: '50%',
		transform: 'translateX(-50%)',
		zIndex: 3,
		top: 196,
		padding: '9px 14px',
		borderRadius: 8,
		background: 'rgba(255, 255, 255, 0.76)',
		color: '#17496b',
		fontSize: 14,
		fontWeight: 750,
		boxShadow: '0 6px 14px rgba(35, 72, 100, 0.16)',
		backdropFilter: 'blur(8px)',
		WebkitBackdropFilter: 'blur(8px)',
	},

	statusMessageError: {
		position: 'static',
		transform: 'none',
		marginTop: 14,
		color: '#9d1f1f',
	},

	piecePanelHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 18,
		margin: '0 2px 15px',
	},

	currentPlayerDetails: {
		minWidth: 0,
		textAlign: 'left',
	},

	panelEyebrow: {
		marginBottom: 8,
		color: '#244f70',
		fontSize: 10,
		fontWeight: 850,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
	},

	panelPlayerName: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		color: '#123f61',
		fontSize: 22,
		fontWeight: 820,
		lineHeight: 1,
	},

	panelPlayerColor: {
		width: 22,
		height: 22,
		borderRadius: '50%',
		boxShadow: 'inset 0 -2px 3px rgba(0, 0, 0, 0.08)',
	},

	panelSubtitle: {
		marginTop: 8,
		color: '#52728a',
		fontSize: 13,
	},

	placementHint: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		flex: '0 0 auto',
		padding: '12px 14px',
		border: '1px solid rgba(87, 131, 160, 0.09)',
		borderRadius: 10,
		background: 'rgba(255, 255, 255, 0.74)',
		boxShadow: '0 5px 14px rgba(49, 96, 129, 0.11)',
		color: '#45677f',
		fontSize: 11,
		fontWeight: 700,
		lineHeight: 1.25,
		textAlign: 'left',
	},

	hintPieceIcon: {
		width: 20,
		height: 20,
		border: '1.5px dashed #7596ae',
		borderRadius: 2,
	},

	pieceCardGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, 72px)',
		gap: 8,
		justifyContent: 'space-between',
	},

	pieceCard: {
		position: 'relative',
		width: 86,
		height: 86,
		boxSizing: 'border-box',
		border: '1px solid rgba(100, 145, 175, 0.08)',
		borderRadius: 9,
		background: 'rgba(255, 255, 255, 0.76)',
		boxShadow: '0 4px 11px rgba(56, 105, 139, 0.1)',
		cursor: 'pointer',
		transition: 'transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease',

		'&:hover': {
			transform: 'translateY(-1px)',
			boxShadow: '0 6px 14px rgba(56, 105, 139, 0.15)',
		},
	},

	selected: {
		borderColor: 'rgba(46, 105, 220, 0.45)',
		boxShadow: '0 0 0 2px rgba(46, 105, 220, 0.12), 0 6px 14px rgba(56, 105, 139, 0.14)',
	},
	placed: {
		cursor: 'default',
	},

	piecesRemaining: {
		margin: 'auto 3px 0',
		paddingTop: 15,
		borderTop: '1px solid rgba(73, 119, 150, 0.14)',
		color: '#315b78',
		fontSize: 12,
		textAlign: 'left',
	},

	remainingDots: {
		display: 'flex',
		alignItems: 'center',
		gap: 7,
		marginTop: 12,

		'& span': {
			width: 9,
			height: 9,
			borderRadius: '50%',
			background: 'var(--piece-color, #0077ee)',
			boxShadow: 'inset 0 -1px 1px rgba(0, 0, 0, 0.12)',
		},
	},

	used: {
		background: '#dce4e8 !important',
		boxShadow: 'none !important',
	},

	piecePanelLockOverlay: {
		position: 'absolute',
		inset: 0,
		zIndex: 4,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 13,
		padding: 24,
		boxSizing: 'border-box',
		borderRadius: 14,
		background: `
			radial-gradient(circle at 50% 47%, rgba(255, 255, 255, 0.54) 0%, rgba(255, 255, 255, 0.44) 18%, transparent 38%),
			linear-gradient(
				rgba(232, 244, 253, 0.42),
				rgba(222, 238, 249, 0.5)
			)
		`,
		backdropFilter: 'blur(1.5px) saturate(0.86)',
		WebkitBackdropFilter: 'blur(1.5px) saturate(0.86)',
		pointerEvents: 'auto',
	},

	piecePanelLockIcon: {
		width: 40,
		height: 40,
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'rgba(255, 255, 255, 0.82)',
		border: '1px solid rgba(122, 157, 180, 0.34)',
		boxShadow: `
			0 8px 18px rgba(67, 124, 163, 0.12),
			inset 0 1px 2px rgba(255, 255, 255, 0.9)
		`,

		'& svg': {
			width: 22,
			height: 22,
			fill: 'none',
			stroke: '#1f5c86',
			strokeWidth: 1.8,
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
		},
	},

	piecePanelLockMessage: {
		maxWidth: 210,
		padding: '2px 8px',
		color: '#123f61',
		fontSize: 15,
		fontWeight: 850,
		lineHeight: 1.18,
		textAlign: 'center',
		textShadow: '0 1px 2px rgba(255, 255, 255, 0.95)',
	},

	glassPieceTile: {
		boxShadow: `
			inset 1px 1px 3px rgba(255, 255, 255, 0.45),
			inset -1px -1px 3px rgba(0, 45, 120, 0.35),
			0 1px 3px rgba(0, 0, 0, 0.18)
		`,

		'&::after': {
			content: '""',
			position: 'absolute',
			width: '48%',
			height: '48%',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%) rotate(45deg)',
			borderRadius: 3,
			background: `
				linear-gradient(
					135deg,
					rgba(0, 35, 120, 0.32) 0%,
					rgba(255, 255, 255, 0.16) 42%,
					rgba(255, 255, 255, 0.28) 50%,
					rgba(0, 35, 120, 0.38) 100%
				)
			`,
			boxShadow: `
				inset 2px 2px 3px rgba(0, 35, 120, 0.45),
				inset -2px -2px 3px rgba(255, 255, 255, 0.22)
			`,
			pointerEvents: 'none',
		},
	},

	pieceTile: {
		position: 'absolute',
		boxSizing: 'border-box',
		overflow: 'hidden',

		'&::after': {
			content: '""',
			position: 'absolute',
			width: '48%',
			height: '48%',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%) rotate(45deg)',
			borderRadius: 2,
			background: `
				linear-gradient(
					135deg,
					rgba(0, 35, 120, 0.32) 0%,
					rgba(255, 255, 255, 0.16) 42%,
					rgba(255, 255, 255, 0.28) 50%,
					rgba(0, 35, 120, 0.38) 100%
				)
			`,
			boxShadow: `
				inset 1px 1px 2px rgba(0, 35, 120, 0.45),
				inset -1px -1px 2px rgba(255, 255, 255, 0.22)
			`,
			pointerEvents: 'none',
		},
	},

	boardFrame: {
		position: 'relative',
		width: 'fit-content',
		height: 'fit-content',
	},

	boardLockOverlay: {
		position: 'absolute',
		inset: 0,
		zIndex: 6,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 18,
		background: `
			linear-gradient(
				rgba(222, 240, 255, 0.48),
				rgba(205, 229, 249, 0.58)
			)
		`,
		backdropFilter: 'blur(1px)',
		WebkitBackdropFilter: 'blur(1px)',
		pointerEvents: 'auto',
	},

	readyDial: {
		position: 'relative',
		width: 230,
		height: 230,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '50%',
		background: 'rgba(255, 255, 255, 0.62)',
		boxShadow: `
			0 18px 45px rgba(60, 139, 242, 0.2),
			inset 0 0 0 1px rgba(255, 255, 255, 0.9)
		`,
		backdropFilter: 'blur(8px)',

		// remove old dotted pseudo ring
		'&::before': {
			content: 'none',
		},
		'&::after': {
			content: 'none',
		},
	},

	readyRingSvg: {
		position: 'absolute',
		inset: 0,
		width: '100%',
		height: '100%',
		overflow: 'visible',
	},

	readyArc: {
		fill: 'none',
		stroke: 'var(--seat-color)',
		strokeWidth: 8,
		strokeLinecap: 'round',
		filter: 'drop-shadow(0 0 7px rgba(60, 139, 242, 0.22))',
		transition: 'stroke 180ms ease',
	},

	readySeatDot: {
		fill: '#d9e4ee',
		stroke: 'rgba(255, 255, 255, 0.95)',
		strokeWidth: 5,
		filter: 'drop-shadow(0 5px 10px rgba(33, 84, 130, 0.22))',
		transition: 'fill 180ms ease, filter 180ms ease',
	},

	readySeatDotFilled: {
		fill: 'var(--seat-color)',
		filter: 'drop-shadow(0 5px 14px rgba(232, 67, 67, 0.32))',
	},

	readyContent: {
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		width: 145,
		height: 145,
		color: '#17496b',
		textAlign: 'center',
	},

	readyIcon: {
		width: 34,
		height: 34,
		marginBottom: 8,
		fill: 'none',
		stroke: '#3c8bf2',
		strokeWidth: 1.8,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},

	readyCount: {
		color: '#17496b',
		fontSize: 31,
		fontWeight: 900,
		lineHeight: 1,
	},

	readyLabel: {
		marginTop: 4,
		color: '#315b78',
		fontSize: 14,
		fontWeight: 750,
	},

	readyMessage: {
		marginTop: 14,
		color: '#52728a',
		fontSize: 13,
		fontWeight: 650,
		lineHeight: 1.25,
	},

	board: {
		display: 'grid',
		gridTemplateColumns: 'repeat(20, 35px)',
		gridTemplateRows: 'repeat(20, 35px)',
		width: 'fit-content',
		height: 'fit-content',
		padding: 10,
		borderRadius: 18,
		background: 'linear-gradient(145deg, #f8fcff, #dcecf5)',
		border: '4px solid rgba(255, 255, 255, 0.8)',
		boxShadow: `
			0 18px 35px rgba(35, 72, 100, 0.35),
			inset 0 2px 8px rgba(255, 255, 255, 0.9),
			inset 0 -4px 10px rgba(90, 130, 160, 0.18)
		`,
	},

	tile: {
		width: 35,
		height: 35,
		boxSizing: 'border-box',
		position: 'relative',
		overflow: 'hidden',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		userSelect: 'none',
		borderRadius: 2,
		transition: 'background-color 0.12s ease, box-shadow 0.12s ease, transform 0.08s ease',
	},
})

export default gameStyles
