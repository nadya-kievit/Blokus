import { useState } from 'react'
import clsx from 'clsx'
import { createGame } from '../services/api'

const TIME_LIMITS = ['No limit', '30s', '60s', '90s']
const PLAYERS = ['Player 1', 'Player 2', 'Player 3', 'Player 4']


function GameSettingsScreen({ onCreateRoom, onBack }) {
	const [timeLimit, setTimeLimit] = useState('60s')
	const [playerTypes, setPlayerTypes] = useState({
		'Player 1': 'Human',
		'Player 2': 'Bot',
		'Player 3': 'Bot',
		'Player 4': 'Bot',
	})
	const [isCreating, setIsCreating] = useState(false)
	const [error, setError] = useState('')

	const handlePlayerTypeChange = (player, type) => { setPlayerTypes(current => ({ ...current, [player]: type })) }

	const handleCreateRoom = async () => {
		setIsCreating(true)
		setError('')

		try {
			const game = await createGame({
				moveTimeLimitSeconds:
					timeLimit === 'No limit' ? null : Number.parseInt(timeLimit, 10),
				players: Object.fromEntries(
					Object.entries(playerTypes).map(([player, type]) => [
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

				<section className="settingsSection">
					<h3>Player type</h3>
					<div className="playerTypeList">
						{PLAYERS.map(player => (
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
