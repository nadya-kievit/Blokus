import { PLAYER_COLOR_HEX } from './playerColors'

export const globalGameStyles = {

	html: {
		minHeight: '100%',
		colorScheme: 'light',
	},

	body: {
		margin: 0,
		minHeight: '100vh',
		background: 'rgba(21, 13, 33)',
		fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	},

	'#root': {
		minHeight: '100vh',
	},

	button: {
		border: '1px solid rgba(151, 104, 216, 0.32)',
		borderRadius: 8,
		padding: '10px 14px',
		background: 'linear-gradient(145deg, #21172f, #171020)',
		color: '#f4f0ff',
		fontWeight: 750,
		cursor: 'pointer',
		boxShadow: '0 4px 12px rgba(5, 2, 12, 0.36)',
	},

	'button:disabled': {
		cursor: 'not-allowed',
		opacity: 0.55,
	}
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

	boardCenterWaiting: {
		zIndex: 5,
	},

	waitingGameVeil: {
		position: 'fixed',
		inset: 0,
		zIndex: 4,
		background: 'rgba(8, 4, 14, 0.32)',
		backdropFilter: 'blur(1px)',
		WebkitBackdropFilter: 'blur(1px)',
		pointerEvents: 'none',
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
		border: '1px solid rgba(155, 113, 211, 0.28)',
		borderRadius: 14,
		background: 'rgba(24, 16, 37, 0.94)',
		boxShadow: '0 16px 38px rgba(3, 1, 9, 0.46)',
		backdropFilter: 'blur(12px)',
		WebkitBackdropFilter: 'blur(12px)',
	},

	playersLeftPanel: {
		position: 'absolute',
		left: 32,
		top: 0,
		zIndex: 2,
		width: 500,
		maxHeight: 760,
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		gap: 27,
	},

	playerPanelGrid: {
		display: 'grid',
		gridTemplateColumns: 'minmax(0, 1fr)',
		gap: 12,
	},

	playerStatusCard: {
		minHeight: 88,
		boxSizing: 'border-box',
		padding: '15px 17px',
		display: 'grid',
		gridTemplateColumns: 'minmax(0, 1fr) auto',
		alignItems: 'center',
		columnGap: 20,
		border: '1px solid rgba(155, 113, 211, 0.28)',
		borderRadius: 8,
		background: 'rgba(24, 16, 37, 0.92)',
		boxShadow: '0 10px 24px rgba(3, 1, 9, 0.38)',
		backdropFilter: 'blur(10px)',
		WebkitBackdropFilter: 'blur(10px)',
		color: '#f2eeff',
		transition: 'border-color 220ms ease, box-shadow 220ms ease',
	},

	playerStatusActive: {
		borderColor: 'var(--player-color)',
	},

	playerStatusEmpty: {
		opacity: 0.74,
	},

	playerStatusHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},

	playerStatusName: {
		display: 'flex',
		alignItems: 'center',
		minWidth: 0,
		gap: 10,
		color: 'var(--player-color)',
		fontSize: 20,
		fontWeight: 850,
		lineHeight: 1,
	},

	playerStatusColor: {
		width: 19,
		height: 19,
		borderRadius: '50%',
		flex: '0 0 auto',
		background: 'var(--player-color)',
		boxShadow: `
			inset 0 2px 3px rgba(255, 255, 255, 0.45),
			inset 0 -2px 4px rgba(0, 0, 0, 0.15)
		`,
	},

	playerStatusBody: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 16,
		textAlign: 'right',
	},

	viewPiecesButton: {
		flex: '0 0 auto',
		padding: '8px 11px',
		whiteSpace: 'nowrap',
	},

	playerRemainingPieces: {
		gridColumn: '1 / -1',
		display: 'grid',
		gridTemplateColumns: 'repeat(5, minmax(0, 80px))',
		gap: 8,
		justifyContent: 'space-between',
		maxHeight: 274,
		overflowX: 'hidden',
		overflowY: 'hidden',
		marginTop: 2,
		paddingTop: 15,
		scrollbarWidth: 'thin',
		scrollbarColor: 'rgba(169, 108, 255, 0.72) transparent',

		'&::-webkit-scrollbar': {
			width: 8,
		},

		'&::-webkit-scrollbar-track': {
			background: 'transparent',
		},

		'&::-webkit-scrollbar-thumb': {
			borderRadius: 999,
			background: 'rgba(169, 108, 255, 0.72)',
		},

		'&::-webkit-scrollbar-button': {
			display: 'none',
			width: 0,
			height: 0,
		},
	},

	playerRemainingPiecesScrollable: {
		overflowY: 'auto',
	},

	playerStatusBlocks: {
		color: '#ffffff',
		fontSize: 30,
		fontWeight: 900,
		lineHeight: 1,
	},

	playerStatusCaption: {
		marginTop: 4,
		color: '#c5bddb',
		fontSize: 14,
		fontWeight: 700,
		lineHeight: 1,
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
		background: 'rgba(24, 16, 37, 0.94)',
		border: '1px solid rgba(155, 113, 211, 0.3)',
		boxShadow: '0 18px 42px rgba(3, 1, 9, 0.48)',
		backdropFilter: 'blur(8px)',
		WebkitBackdropFilter: 'blur(8px)',
		textAlign: 'center',

		'& h2': {
			margin: '0 0 10px',
			color: '#f2eeff',
			fontSize: 24,
			fontWeight: 750,
		},

		'& p': {
			margin: '0 0 22px',
			color: '#c5bddb',
			fontSize: 15,
			lineHeight: 1.45,
		},
	},

	playerInfoPanelStage: {
		position: 'relative',
		width: 750,
		height: 430,
		maxWidth: 'calc(100vw - 32px)',
		overflow: 'hidden',
	},

	playerInfoPanel: {
		position: 'absolute',
		inset: 0,
		width: '100%',
		height: '100%',
	},

	playerNameForm: {
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
	},

	playerNameInput: {
		width: '100%',
		height: 64,
		boxSizing: 'border-box',
		padding: '0 22px',
		border: '1px solid rgba(169, 108, 255, 0.72)',
		borderRadius: 8,
		outline: 'none',
		background: 'rgba(18, 11, 29, 0.88)',
		color: '#f4f0ff',
		font: 'inherit',
		fontSize: 18,

		'&::placeholder': {
			color: '#958ba9',
		},

		'&:focus': {
			borderColor: 'rgba(169, 108, 255, 0.92)',
			boxShadow: '0 0 0 3px rgba(169, 108, 255, 0.16)',
		},
	},

	playerInfoActions: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 22,
		marginTop: 'auto',
	},

	startDivider: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		margin: '20px 0',
		color: '#958ba9',

		'&::before, &::after': {
			content: '""',
			flex: 1,
			height: 1,
			background: 'rgba(155, 113, 211, 0.24)',
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
			border: '1px solid rgba(155, 113, 211, 0.32)',
			borderRadius: 7,
			padding: 0,
			background: 'rgba(18, 11, 29, 0.88)',
			color: '#f4f0ff',
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
				borderColor: 'rgba(169, 108, 255, 0.78)',
				boxShadow: `
					0 0 0 3px rgba(169, 108, 255, 0.18),
					0 6px 16px rgba(3, 1, 9, 0.34)
				`,
				transform: 'translateY(-1px)',
			},
		},
	},

	inviteLabel: {
		color: '#9d93b1',
		fontSize: 12,
		fontWeight: 750,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},

	inviteCode: {
		margin: '2px 0 22px',
		color: '#b77cff',
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

	settingsPanel: {
		width: 700,
		maxWidth: 'calc(100vw - 32px)',
		padding: '34px 36px 30px',
		textAlign: 'left',

		'& > h2, & > p': {
			textAlign: 'center',
		},
	},

	settingsSection: {
		padding: '22px 10px 24px',
		borderTop: '1px solid rgba(155, 113, 211, 0.24)',

		'& h3': {
			margin: '0 0 15px',
			color: '#f2eeff',
			fontSize: 17,
			fontWeight: 800,
		},
	},

	timeLimitOptions: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
		gap: 14,
	},

	settingsOption: {
		minHeight: 48,
		color: '#a9a0bd',
		boxShadow: 'none',
	},

	settingsOptionSelected: {
		borderColor: 'rgba(169, 108, 255, 0.82) !important',
		background: 'rgba(90, 47, 126, 0.54) !important',
		color: '#ffffff !important',
		boxShadow: 'none !important',
	},

	playerTypeList: {
		display: 'flex',
		flexDirection: 'column',
		gap: 8,
	},

	playerTypeRow: {
		minHeight: 54,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 20,
		padding: '4px 6px 4px 14px',
		boxSizing: 'border-box',
		border: '1px solid rgba(155, 113, 211, 0.2)',
		borderRadius: 8,
		background: 'rgba(19, 12, 30, 0.58)',
	},

	settingsPlayerName: {
		display: 'flex',
		alignItems: 'center',
		color: '#f2eeff',
		fontSize: 16,
		fontWeight: 800,
	},

	playerTypeToggle: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		width: 232,
		minHeight: 42,
		padding: 3,
		borderRadius: 7,
		background: 'rgba(17, 10, 27, 0.82)',
		boxShadow: 'none',
		overflow: 'hidden',

		'& span': {
			position: 'relative',
			zIndex: 2,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			color: '#a9a0bd',
			transition: 'color 160ms ease',
		},

		'& span:first-of-type': {
			color: '#ffffff',
		},

		'& i': {
			position: 'absolute',
			zIndex: 1,
			top: 3,
			bottom: 3,
			left: 3,
			width: 'calc(50% - 3px)',
			border: '1px solid rgba(169, 108, 255, 0.72)',
			borderRadius: 5,
			boxSizing: 'border-box',
			background: 'rgba(90, 47, 126, 0.54)',
			transition: 'transform 160ms ease',
		},
	},

	playerTypeToggleBot: {
		'& span:first-of-type': {
			color: '#a9a0bd',
		},

		'& span:nth-of-type(2)': {
			color: '#ffffff',
		},

		'& i': {
			transform: 'translateX(100%)',
		},
	},

	settingsActions: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 32,
		paddingTop: 24,
		borderTop: '1px solid rgba(155, 113, 211, 0.24)',

		'& button': {
			minWidth: 155,
			minHeight: 48,
		},
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
		border: '1px solid rgba(155, 113, 211, 0.26)',
		borderRadius: 11,
		background: 'rgba(22, 14, 33, 0.96)',
		boxShadow: '0 10px 28px rgba(3, 1, 9, 0.42)',
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
		color: '#eee9ff',
		fontSize: 42,
		letterSpacing: 1,
		textShadow: '0 2px 10px rgba(126, 79, 210, 0.38)',
	},

	gameHeaderTitle: {
		fontSize: 32,
		fontWeight: 850,
		lineHeight: 1,
		letterSpacing: 0.4,
		color: '#e8e2ff',
		textShadow: '0 2px 8px rgba(130, 87, 218, 0.38)',
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

	joining: {
		background: PLAYER_COLOR_HEX.Yellow,
	},

	disconnected: {
		background: PLAYER_COLOR_HEX.Red,
	},

	error: {
		background: PLAYER_COLOR_HEX.Red,
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
		color: '#bdb4d3',
		fontSize: 12,

		'& strong': {
			color: '#a96cff',
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
		borderColor: 'rgba(155, 113, 211, 0.28)',
		borderRadius: 7,
		background: 'rgba(26, 17, 39, 0.9)',
		boxShadow: '0 4px 12px rgba(3, 1, 9, 0.3)',
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
		color: '#f2eeff',

		'& svg': {
			color: '#a96cff',
		},
	},

	dangerButton: {
		color: '#e5252a',
		borderColor: 'rgba(229, 37, 42, 0.12)',
		background: 'rgba(26, 17, 39, 0.9)',
	},

	turnBanner: {
		display: 'flex',
		alignItems: 'center',
		gap: 14,
		width: 'max-content',
		minWidth: 215,
		maxWidth: 'calc(100vw - 48px)',
		boxSizing: 'border-box',
		padding: '12px 18px',
		border: '1px solid rgba(155, 113, 211, 0.28)',
		borderRadius: 14,
		background: 'rgba(24, 16, 37, 0.94)',
		color: '#f2eeff',
		boxShadow: '0 12px 28px rgba(3, 1, 9, 0.42)',
		backdropFilter: 'blur(12px)',
		WebkitBackdropFilter: 'blur(12px)',
	},

	finishedBanner: {
		width: 'max-content',
		minWidth: 330,
		justifyContent: 'space-between',
	},

	restartButton: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 7,
		flex: '0 0 auto',
		minHeight: 34,
		padding: '8px 11px',
		borderRadius: 7,
		borderColor: 'rgba(37, 181, 100, 0.2)',
		background: 'rgba(30, 20, 44, 0.94)',
		color: '#20824b',
		fontSize: 12,
		fontWeight: 850,

		'& svg': {
			width: 16,
			height: 16,
			fill: 'none',
			stroke: 'currentColor',
			strokeWidth: 1.9,
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
		},
	},

	turnAvatar: {
		flex: '0 0 auto',
		width: 38,
		height: 38,
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: `var(--turn-color, ${PLAYER_COLOR_HEX.Yellow})`,
		boxShadow: `
			inset 0 2px 3px rgba(255, 255, 255, 0.5),
			inset 0 -3px 5px rgba(0, 0, 0, 0.12),
			0 4px 9px rgba(35, 72, 100, 0.16)
		`,

		'& svg': {
			width: 23,
			height: 23,
			fill: '#170f25',
			stroke: '#170f25',
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
		color: '#f6f2ff',
		fontSize: 16,
		fontWeight: 850,
		lineHeight: 1.08,
		whiteSpace: 'nowrap',
	},

	turnTimer: {
		marginTop: 3,
		color: 'rgba(246, 242, 255, 0.78)',
		fontSize: 13,
		fontVariantNumeric: 'tabular-nums',
		fontWeight: 750,
		lineHeight: 1,
	},

	statusMessage: {
		position: 'absolute',
		left: '50%',
		transform: 'translateX(-50%)',
		zIndex: 3,
		top: 196,
		padding: '9px 14px',
		borderRadius: 8,
		background: 'rgba(24, 16, 37, 0.94)',
		color: '#f2eeff',
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

	modalBackdrop: {
		position: 'fixed',
		inset: 0,
		zIndex: 20,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		boxSizing: 'border-box',
		background: 'rgba(7, 4, 12, 0.62)',
		backdropFilter: 'blur(4px)',
		WebkitBackdropFilter: 'blur(4px)',
	},

	winnerModal: {
		position: 'relative',
		width: 420,
		maxWidth: 'calc(100vw - 48px)',
		boxSizing: 'border-box',
		padding: '30px 28px 26px',
		border: '1px solid rgba(155, 113, 211, 0.3)',
		borderRadius: 10,
		background: 'rgba(24, 16, 37, 0.98)',
		boxShadow: '0 24px 60px rgba(3, 1, 9, 0.62)',
		color: '#f2eeff',
		textAlign: 'center',
	},

	modalCloseButton: {
		position: 'absolute',
		top: 13,
		right: 13,
		width: 34,
		height: 34,
		padding: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 7,
		background: 'rgba(40, 27, 57, 0.9)',
		color: '#cfc6ed',

		'& svg': {
			width: 18,
			height: 18,
			fill: 'none',
			stroke: 'currentColor',
			strokeWidth: 2,
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
		},
	},

	winnerBadge: {
		width: 64,
		height: 64,
		margin: '0 auto 15px',
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'var(--winner-color)',
		boxShadow: `
			inset 0 2px 4px rgba(255, 255, 255, 0.45),
			inset 0 -5px 9px rgba(0, 0, 0, 0.14),
			0 9px 18px rgba(35, 72, 100, 0.2)
		`,

		'& svg': {
			width: 34,
			height: 34,
			fill: 'rgba(255, 255, 255, 0.68)',
			stroke: '#170f25',
			strokeWidth: 1.7,
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
		},
	},

	winnerTitle: {
		color: '#f4f0ff',
		fontSize: 30,
		fontWeight: 900,
		lineHeight: 1.05,
	},

	winnerSubtitle: {
		marginTop: 7,
		color: '#c5bddb',
		fontSize: 14,
		fontWeight: 800,
	},

	leaderboardList: {
		display: 'flex',
		flexDirection: 'column',
		gap: 8,
		marginTop: 22,
	},

	leaderboardRow: {
		display: 'grid',
		gridTemplateColumns: '36px 1fr 96px',
		alignItems: 'center',
		gap: 12,
		minHeight: 46,
		padding: '8px 11px',
		boxSizing: 'border-box',
		border: '1px solid rgba(155, 113, 211, 0.22)',
		borderRadius: 8,
		background: 'rgba(19, 12, 30, 0.78)',
		textAlign: 'left',
	},

	leaderboardRank: {
		width: 28,
		height: 28,
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'var(--leader-color)',
		color: '#170f25',
		fontSize: 14,
		fontWeight: 900,
		boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5)',
	},

	leaderboardName: {
		display: 'flex',
		alignItems: 'center',
		gap: 9,
		minWidth: 0,
		color: '#f2eeff',
		fontSize: 16,
		fontWeight: 850,

		'& span': {
			width: 12,
			height: 12,
			flex: '0 0 auto',
			borderRadius: '50%',
			background: 'var(--leader-color)',
		},
	},

	leaderboardBlocks: {
		color: '#c5bddb',
		fontSize: 13,
		fontWeight: 800,
		textAlign: 'right',
		whiteSpace: 'nowrap',
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

	panelPlayerName: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		color: '#ffffff',
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

	placementHint: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		flex: '0 0 auto',
		padding: '12px 14px',
		border: '1px solid rgba(155, 113, 211, 0.2)',
		borderRadius: 10,
		background: 'rgba(19, 12, 30, 0.64)',
		boxShadow: '0 5px 14px rgba(3, 1, 9, 0.28)',
		color: '#ded7ef',
		fontSize: 11,
		fontWeight: 700,
		lineHeight: 1.25,
		textAlign: 'left',
	},

	hintPieceIcon: {
		width: 20,
		height: 20,
		border: '1.5px dashed #78698f',
		borderRadius: 2,
	},

	pieceCardGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, 86px)',
		gap: 8,
		justifyContent: 'space-between',
	},

	pieceGridItem: {
		width: 86,
		height: 86,
	},

	pieceCard: {
		position: 'relative',
		width: 86,
		height: 86,
		boxSizing: 'border-box',
		border: '1px solid rgba(147, 121, 181, 0.34)',
		borderRadius: 9,
		background: 'rgba(19, 12, 30, 0.78)',
		boxShadow: '0 5px 14px rgba(3, 1, 9, 0.3)',
		cursor: 'pointer',
		transition: 'transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease',

		'&:hover': {
			transform: 'translateY(-1px)',
			boxShadow: '0 0 0 1px rgba(169, 108, 255, 0.34), 0 8px 18px rgba(3, 1, 9, 0.38)',
		},
	},

	pieceCardNoHover: {
		position: 'relative',
		width: 86,
		height: 86,
		boxSizing: 'border-box',
		border: '1px solid rgba(147, 121, 181, 0.34)',
		borderRadius: 9,
		background: 'rgba(19, 12, 30, 0.78)',
		boxShadow: '0 5px 14px rgba(3, 1, 9, 0.3)',
		cursor: 'default',
		transition: 'transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease'
	},

	selected: {
		borderColor: 'rgba(169, 108, 255, 0.8)',
		boxShadow: '0 0 0 2px rgba(169, 108, 255, 0.2), 0 7px 18px rgba(3, 1, 9, 0.36)',
	},
	placed: {
		cursor: 'default',
	},

	piecesRemaining: {
		margin: 'auto 3px 0',
		paddingTop: 15,
		color: '#c5bddb',
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
			background: `var(--piece-color, ${PLAYER_COLOR_HEX.Blue})`,
			boxShadow: 'inset 0 -1px 1px rgba(0, 0, 0, 0.12)',
			transition: 'background-color 220ms ease, box-shadow 220ms ease',
		},
	},

	used: {
		background: '#454052 !important',
		boxShadow: 'none !important',
	},

	boardFrame: {
		position: 'relative',
		width: 'fit-content',
	},

	boardLockOverlay: {
		position: 'absolute',
		inset: 0,
		zIndex: 6,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 18,
		background: 'rgba(8, 4, 14, 0.32)',
		backdropFilter: 'blur(1px)',
		WebkitBackdropFilter: 'blur(1px)',
	},

	readyDial: {
		position: 'relative',
		width: 230,
		height: 230,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '50%',
		border: '1px solid rgba(7, 2, 5, 0.9)',
		background: 'rgba(24, 16, 37, 0.9)',
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
		color: '#f2eeff',
		textAlign: 'center',
	},

	readyCount: {
		color: '#f2eeff',
		fontSize: 31,
		fontWeight: 900,
		lineHeight: 1,
	},

	readyLabel: {
		marginTop: 4,
		color: '#c5bddb',
		fontSize: 14,
		fontWeight: 750,
	},

	readyMessage: {
		marginTop: 14,
		color: '#9d93b1',
		fontSize: 13,
		fontWeight: 650,
		lineHeight: 1.25,
	},

	board: {
		display: 'grid',
		gridTemplateColumns: 'repeat(20, 35px)',
		gridTemplateRows: 'repeat(20, 35px)',
		width: 'fit-content',
		padding: 10,
		borderRadius: 18,
		background: 'linear-gradient(145deg, #21182f, #151020)',
		border: '4px solid rgba(145, 92, 216, 0.42)',
		boxShadow: `
			0 20px 42px rgba(3, 1, 9, 0.58),
			0 0 24px rgba(120, 71, 196, 0.16),
			inset 0 0 0 1px rgba(202, 177, 236, 0.12)
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

	glassPieceTile: {
		boxShadow: `
			inset 1px 1px 2px rgba(255, 255, 255, 0.32),
			inset -1px -1px 2px rgba(0, 0, 0, 0.28),
			0 1px 3px rgba(0, 0, 0, 0.3)
		`,

		'&::after': {
			content: '""',
			position: 'absolute',
			width: '42%',
			height: '42%',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%) rotate(45deg)',
			borderRadius: 2,
			background: `
				linear-gradient(
					135deg,
					rgba(0, 0, 0, 0.3),
					rgba(0, 0, 0, 0.16) 52%,
					rgba(255, 255, 255, 0.1)
				)
			`,
			boxShadow: `
				inset 1px 1px 2px rgba(0, 0, 0, 0.48),
				inset -1px -1px 1px rgba(255, 255, 255, 0.2)
			`,
			pointerEvents: 'none',
		},
	},

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
})

export default gameStyles
