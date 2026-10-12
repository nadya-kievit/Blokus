import { useState } from 'react'
import clsx from 'clsx'
import { createGame } from '../services/api'

const TIME_LIMITS = ['No limit', '30s', '60s', '90s']
const PLAYER_COUNTS = [2, 3, 4, 5, 6]
const PLAYERS = Array.from({ length: 6 }, (_, index) => `Player ${index + 1}`)
const BOARD_LAYOUTS = [
	{
		id: 'square',
		label: 'Classic',
		cells: Array.from({ length: 25 }, (_, index) => [
			Math.floor(index / 5),
			index % 5,
		]),
	},
	{
		id: 'irregular',
		label: 'Irregular',
		cells: [
			[0, 2],
			[1, 1], [1, 2], [1, 3],
			[2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
			[3, 1], [3, 2], [3, 3],
			[4, 2],
		],
	},
	{
		id: 'rooms',
		label: 'Rooms',
		cells: [
			[0, 0], [0, 1], [0, 5], [0, 6],
			[1, 0], [1, 1], [1, 5], [1, 6],
			[2, 1], [2, 5],
			[3, 1], [3, 2], [3, 3], [3, 4], [3, 5],
			[4, 3], [4, 4],
		],
	},
]


function BoardLayoutPreview({ cells }) {
	return (
		<span className="boardLayoutPreview" aria-hidden="true">
			{cells.map(([row, column]) => (
				<i
					key={`${row}-${column}`}
					style={{ gridRow: row + 1, gridColumn: column + 1 }}
				/>
			))}
		</span>
	)
}


function GameSettingsScreen({ onCreateRoom, onBack }) {
	const [boardLayout, setBoardLayout] = useState('square')
	const [playerCount, setPlayerCount] = useState(4)
	const [timeLimit, setTimeLimit] = useState('60s')
	const [playerTypes, setPlayerTypes] = useState({
		'Player 1': 'Human',
		'Player 2': 'Bot',
		'Player 3': 'Bot',
		'Player 4': 'Bot',
		'Player 5': 'Bot',
		'Player 6': 'Bot',
	})
	const [isCreating, setIsCreating] = useState(false)
	const [error, setError] = useState('')

	const handlePlayerTypeChange = (player, type) => { setPlayerTypes(current => ({ ...current, [player]: type })) }

	const handleCreateRoom = async () => {
		setIsCreating(true)
		setError('')

		try {
			const game = await createGame({
				boardLayout,
				playerCount,
				moveTimeLimitSeconds:
					timeLimit === 'No limit' ? null : Number.parseInt(timeLimit, 10),
				players: Object.fromEntries(
					Object.entries(playerTypes).slice(0, playerCount).map(([player, type]) => [
						player,
						{ color: null, isBot: type === 'Bot' },
					]),
				),
			})
			onCreateRoom(game)
		} catch (err) {
			setError(err.message)
			setIsCreating(false)
		}
	}

	
	return (
		<div className="startPage">
			<h1 className="gameTitle">Blokit</h1>

			<div className="startPanel settingsPanel">
				<h2>Game settings</h2>

				<section className="settingsSection">
					<h3>Board layout</h3>
					<div className="boardLayoutOptions" role="radiogroup" aria-label="Board layout">
						{BOARD_LAYOUTS.map(layout => (
							<button
								key={layout.id}
								type="button"
								role="radio"
								className={clsx(
									'boardLayoutOption',
									boardLayout === layout.id && 'settingsOptionSelected',
								)}
								aria-checked={boardLayout === layout.id}
								onClick={() => setBoardLayout(layout.id)}
							>
								<BoardLayoutPreview cells={layout.cells} />
								<span>{layout.label}</span>
							</button>
						))}
					</div>
				</section>

				<section className="settingsSection">
					<h3>Player type</h3>
					<div className="playerCountOptions" aria-label="Number of players">
						{PLAYER_COUNTS.map(count => (
							<button
								key={count}
								type="button"
								className={clsx(
									'settingsOption',
									playerCount === count && 'settingsOptionSelected',
								)}
								aria-pressed={playerCount === count}
								onClick={() => setPlayerCount(count)}
							>
								{count}
							</button>
						))}
					</div>
					<div className="playerTypeList">
						{PLAYERS.slice(0, playerCount).map(player => (
							<div className="playerTypeRow" key={player}>
								<div className="settingsPlayerName">
									{player}
								</div>

								<button
									type="button"
									role="switch"
									aria-checked={playerTypes[player] === 'Bot'}
									aria-label={`${player} type: ${playerTypes[player]}`}
									className={clsx(
										'playerTypeToggle',
										playerTypes[player] === 'Bot' &&
											'playerTypeToggleBot',
									)}
									onClick={() =>
										handlePlayerTypeChange(
											player,
											playerTypes[player] === 'Human' ? 'Bot' : 'Human',
										)
									}
								>
									<span>Human</span>
									<span>Bot</span>
									<i aria-hidden="true" />
								</button>
							</div>
						))}
					</div>
				</section>

				<section className="settingsSection">
					<h3>Time limit per move</h3>
					<div className="timeLimitOptions">
						{TIME_LIMITS.map(option => (
							<button
								key={option}
								type="button"
								className={clsx(
									'settingsOption',
									timeLimit === option && 'settingsOptionSelected',
								)}
								aria-pressed={timeLimit === option}
								onClick={() => setTimeLimit(option)}
							>
								{option}
							</button>
						))}
					</div>
				</section>

				<div className="settingsActions">
					<button type="button" className="textButton" onClick={onBack}>
						Back
					</button>
					<button type="button" onClick={handleCreateRoom} disabled={isCreating}>
						{isCreating ? 'Creating Room...' : 'Create Room'}
					</button>
				</div>

				{error && (
					<div className="statusMessage statusMessageError">
						{error}
					</div>
				)}
			</div>
		</div>
	)
}

export default GameSettingsScreen
