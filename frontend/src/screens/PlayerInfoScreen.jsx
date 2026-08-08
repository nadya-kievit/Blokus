import { useEffect, useState } from 'react'
import { makeStyles } from 'tss-react/mui'
import clsx from 'clsx'
import { getGame, joinGame } from '../services/api'
import gameStyles from '../gameStyles'
import PieceBagButton from '../components/PieceBagButton'
import { getPlayerColorHex } from '../playerColors'

const useStyles = makeStyles()(gameStyles)

function PlayerInfoScreen({ gameId, initialGame, onJoined, onBack }) {
	const { classes } = useStyles()
	const storageKey = `blokus-player-${gameId}`
	const adminToken = localStorage.getItem(`blokus-admin-${gameId}`)
	const [game, setGame] = useState(initialGame)
	const [step, setStep] = useState('color')
	const [selectedColor, setSelectedColor] = useState(null)
	const [playerName, setPlayerName] = useState('')
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

	const handleChooseColor = color => {
		setSelectedColor(color)
		setLastMessage('')
		setStep('name')
	}

	const handleBackToColors = () => {
		setLastMessage('')
		setStep('color')
	}

	const handleJoinGame = async event => {
		event.preventDefault()

		if (!selectedColor || isJoining || !playerName.trim()) return

		setIsJoining(true)
		setLastMessage('')

		try {
			const player = await joinGame(gameId, selectedColor, playerName.trim(), adminToken)

			localStorage.setItem(storageKey, JSON.stringify(player))
			onJoined()
		} catch (err) {
			setLastMessage(err.message)

			const latestGame = await getGame(gameId)
			setGame(latestGame)
			setSelectedColor(null)
			setStep('color')
		} finally {
			setIsJoining(false)
		}
	}

	return (
		<div className={classes.startPage}>
			<h1 className={classes.gameTitle}>Blokus</h1>

			<div className={classes.playerInfoPanelStage}>
					{step === 'color' ? (
						<div className={clsx(classes.startPanel, classes.playerInfoPanel)}>
							<div className={classes.inviteLabel}>Invite code</div>
							<div className={classes.inviteCode}>{gameId}</div>

							<h2>Choose your color</h2>

							{!game && !lastMessage && (
								<p>Loading available colors...</p>
							)}

							{game && (
								<div className={classes.colorOptions}>
									{game.availableColors.map(option => (
										<PieceBagButton
											key={option.color}
											name={option.color}
											color={getPlayerColorHex(option.color)}
											size={150}
											onClick={() => handleChooseColor(option.color)}
										/>
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
					) : (
						<div className={clsx(classes.startPanel, classes.playerInfoPanel)}>
							<form className={classes.playerNameForm} onSubmit={handleJoinGame}>
								<div className={classes.inviteLabel}>Invite code</div>
								<div className={classes.inviteCode}>{gameId}</div>

								<div className={classes.playerNameFields}>
									<h2>Set your player name</h2>

									<input
										type="text"
										value={playerName}
										onChange={event => setPlayerName(event.target.value)}
										className={classes.playerNameInput}
										placeholder="Enter player name"
										maxLength={24}
										autoFocus
									/>
								</div>

								<div className={classes.playerInfoActions}>
									<button type="button" className={classes.textButton} onClick={handleBackToColors}>
										Back
									</button>

									<button type="submit" disabled={isJoining || !playerName.trim()}>
										{isJoining ? 'Joining...' : 'Join Game'}
									</button>
								</div>
							</form>
						</div>
					)}
			</div>
		</div>
	)
}

export default PlayerInfoScreen
