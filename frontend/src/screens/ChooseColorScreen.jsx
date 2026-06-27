import { useEffect, useState } from 'react'
import { makeStyles } from 'tss-react/mui'
import clsx from 'clsx'
import { getGame, joinGame } from '../services/api'
import gameStyles from '../gameStyles'

const useStyles = makeStyles()(gameStyles)

function ChooseColorScreen({ gameId, initialGame, onJoined, onBack }) {
	const { classes } = useStyles()

	const storageKey = `blokus-player-${gameId}`

	const [game, setGame] = useState(initialGame)
	const [isJoining, setIsJoining] = useState(false)
	const [lastMessage, setLastMessage] = useState('')

	useEffect(() => {
		if (game) return

		let isActive = true

		async function loadGame() {
			try {
				const latestGame = await getGame(gameId)

				if (isActive) {
					setGame(latestGame)
				}
			} catch (err) {
				if (isActive) {
					setLastMessage(err.message)
				}
			}
		}

		loadGame()

		return () => {
			isActive = false
		}
	}, [gameId, game])

	const handleChooseColor = async color => {
		setIsJoining(true)
		setLastMessage('')

		try {
			const player = await joinGame(gameId, color)

			localStorage.setItem(storageKey, JSON.stringify(player))
			onJoined()
		} catch (err) {
			setLastMessage(err.message)

			const latestGame = await getGame(gameId)
			setGame(latestGame)
		} finally {
			setIsJoining(false)
		}
	}

	return (
		<div className={classes.startPage}>
			<h1 className={classes.gameTitle}>Blokus</h1>

			<div className={classes.startPanel}>
				<div className={classes.inviteLabel}>Invite code</div>
				<div className={classes.inviteCode}>{gameId}</div>

				<h2>Choose your color</h2>

				{!game && !lastMessage && (
					<p>Loading available colors...</p>
				)}

				{game && (
					<div className={classes.colorOptions}>
						{game.availableColors.map(option => (
							<button
								key={option.name}
								disabled={isJoining}
								onClick={() => handleChooseColor(option.name)}
							>
								<span
									className={classes.playerColor}
									style={{ background: option.color }}
								/>

								{option.name}
							</button>
						))}
					</div>
				)}

				<button className={classes.textButton} onClick={onBack}>
					Back
				</button>

				{lastMessage && (
					<div className={clsx(classes.statusMessage, classes.statusMessageError)}>
						{lastMessage}
					</div>
				)}
			</div>
		</div>
	)
}

export default ChooseColorScreen