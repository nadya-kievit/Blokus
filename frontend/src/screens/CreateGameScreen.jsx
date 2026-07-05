import { useState } from 'react'
import { makeStyles } from 'tss-react/mui'
import clsx from 'clsx'
import { createGame } from '../services/api'
import gameStyles from '../gameStyles'

const useStyles = makeStyles()(gameStyles)

function CreateGameScreen({ onEnterGame }) {
	const { classes } = useStyles()

	const [isCreating, setIsCreating] = useState(false)
	const [inviteCode, setInviteCode] = useState('')
	const [error, setError] = useState('')

	const handleCreateGame = async () => {
		setIsCreating(true)
		setError('')

		try {
			const game = await createGame()
			onEnterGame(game)
		} catch (err) {
			setError(err.message)
			setIsCreating(false)
		}
	}

	const handleJoinGame = event => {
		event.preventDefault()

		if (!/^\d{6}$/.test(inviteCode)) {
			setError('Enter a 6 digit invite code.')
			return
		}

		onEnterGame(inviteCode)
	}

	return (
		<div className={classes.startPage}>
			<h1 className={classes.gameTitle}>Blokus</h1>

			<div className={classes.startPanel} style={{width: '500px'}}>
				<h2>Play online</h2>

				<p>Create a new room or join friends with their 6 digit invite code.</p>

				<button onClick={handleCreateGame} disabled={isCreating}>
					{isCreating ? 'Creating...' : 'Create Game'}
				</button>

				<div className={classes.startDivider}>
					<span>or</span>
				</div>

				<form className={classes.joinForm} onSubmit={handleJoinGame}>
					<input
						aria-label="6 digit invite code"
						inputMode="numeric"
						maxLength="6"
						placeholder="000000"
						value={inviteCode}
						onChange={event =>
							setInviteCode(event.target.value.replace(/\D/g, '').slice(0, 6))
						}
					/>

					<button type="submit" disabled={inviteCode.length !== 6}>
						Join Game
					</button>
				</form>

				{error && (
					<div className={clsx(classes.statusMessage, classes.statusMessageError)}>
						{error}
					</div>
				)}
			</div>
		</div>
	)
}

export default CreateGameScreen