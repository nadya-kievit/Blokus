import { useState } from 'react'
import { makeStyles } from 'tss-react/mui'
import clsx from 'clsx'
import { createGame } from '../services/api'
import gameStyles from '../gameStyles'

const useStyles = makeStyles()(gameStyles)

const TIME_LIMITS = ['No limit', '30s', '60s', '90s']
const PLAYERS = ['Player 1', 'Player 2', 'Player 3', 'Player 4']


function GameSettingsScreen({ onCreateRoom, onBack }) {
	const { classes } = useStyles()
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
		<div className={classes.startPage}>
			<h1 className={classes.gameTitle}>Blokit</h1>

			<div className={clsx(classes.startPanel, classes.settingsPanel)}>
				<h2>Game settings</h2>

				<section className={classes.settingsSection}>
					<h3>Time limit per move</h3>
					<div className={classes.timeLimitOptions}>
						{TIME_LIMITS.map(option => (
							<button
								key={option}
								type="button"
								className={clsx(
									classes.settingsOption,
									timeLimit === option && classes.settingsOptionSelected,
								)}
								aria-pressed={timeLimit === option}
								onClick={() => setTimeLimit(option)}
							>
								{option}
							</button>
						))}
					</div>
				</section>

				<section className={classes.settingsSection}>
					<h3>Player type</h3>
					<div className={classes.playerTypeList}>
						{PLAYERS.map(player => (
							<div className={classes.playerTypeRow} key={player}>
								<div className={classes.settingsPlayerName}>
									{player}
								</div>

								<button
									type="button"
									role="switch"
									aria-checked={playerTypes[player] === 'Bot'}
									aria-label={`${player} type: ${playerTypes[player]}`}
									className={clsx(
										classes.playerTypeToggle,
										playerTypes[player] === 'Bot' &&
											classes.playerTypeToggleBot,
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

				<div className={classes.settingsActions}>
					<button type="button" className={classes.textButton} onClick={onBack}>
						Back
					</button>
					<button type="button" onClick={handleCreateRoom} disabled={isCreating}>
						{isCreating ? 'Creating Room...' : 'Create Room'}
					</button>
				</div>

				{error && (
					<div className={clsx(classes.statusMessage, classes.statusMessageError)}>
						{error}
					</div>
				)}
			</div>
		</div>
	)
}

export default GameSettingsScreen
