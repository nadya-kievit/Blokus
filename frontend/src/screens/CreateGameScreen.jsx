import { useRef, useState } from 'react'
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
	const codeInputRefs = useRef([])

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

	const focusCodeInput = index => {
		codeInputRefs.current[index]?.focus()
	}

	const updateInviteCode = (index, value) => {
		const digits = value.replace(/\D/g, '')

		if (!digits) {
			setInviteCode(inviteCode.slice(0, index) + inviteCode.slice(index + 1))
			return
		}

		const nextCode = inviteCode.padEnd(6, ' ').split('')

		digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
			nextCode[index + offset] = digit
		})

		const compactCode = nextCode.join('').replace(/\s/g, '').slice(0, 6)
		setInviteCode(compactCode)
		focusCodeInput(Math.min(compactCode.length, 5))
	}

	const handleCodeKeyDown = (event, index) => {
		if (event.key === 'Backspace' && !inviteCode[index] && index > 0) {
			event.preventDefault()
			setInviteCode(inviteCode.slice(0, index - 1) + inviteCode.slice(index))
			focusCodeInput(index - 1)
		}

		if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault()
			focusCodeInput(index - 1)
		}

		if (event.key === 'ArrowRight' && index < 5) {
			event.preventDefault()
			focusCodeInput(index + 1)
		}
	}

	const handleCodePaste = (event, index) => {
		event.preventDefault()
		updateInviteCode(index, event.clipboardData.getData('text'))
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
					<div className={classes.codeInputGroup} aria-label="6 digit invite code">
						{Array.from({ length: 6 }).map((_, index) => (
							<input
								key={index}
								ref={element => {
									codeInputRefs.current[index] = element
								}}
								aria-label={`Invite code digit ${index + 1}`}
								inputMode="numeric"
								maxLength="6"
								value={inviteCode[index] || ''}
								onChange={event => updateInviteCode(index, event.target.value)}
								onFocus={event => event.target.select()}
								onKeyDown={event => handleCodeKeyDown(event, index)}
								onPaste={event => handleCodePaste(event, index)}
							/>
						))}
					</div>

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
