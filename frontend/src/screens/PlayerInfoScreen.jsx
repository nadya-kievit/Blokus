import { useEffect, useState } from 'react'
import { getGame, joinGame } from '../services/api'
import PieceBagButton from '../components/PieceBagButton'
import { getPlayerColorHex } from '../playerColors'

function PlayerInfoScreen({ gameId, initialGame, onJoined, onBack }) {
	const storageKey = `blokit-player-${gameId}`
	const adminToken = localStorage.getItem(`blokit-admin-${gameId}`)
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
		<div className="startPage">
			<h1 className="gameTitle">Blokit</h1>
				{step === 'color' ? (
					<div className="startPanel chooseColorPanel">
						<div className="inviteLabel">Invite code</div>
						<div className="inviteCode">{gameId}</div>

						<h2>Choose your color</h2>

						{!game && !lastMessage && (
							<p>Loading available colors...</p>
						)}

						{game && (
							<div className="colorOptions">
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

						<button className="textButton" onClick={onBack}>
							Back
						</button>

						{lastMessage && (
							<div className="statusMessage statusMessageError">
								{lastMessage}
							</div>
						)}
					</div>
				) : (
					<div className="startPanel chooseNamePanel">
						<form className="playerNameForm" onSubmit={handleJoinGame}>
							<div className="inviteLabel">Invite code</div>
							<div className="inviteCode">{gameId}</div>

							<div className="playerNameFields">
								<h2>Set your player name</h2>

								<input
									type="text"
									value={playerName}
									onChange={event => setPlayerName(event.target.value)}
									className="playerNameInput"
									placeholder="Enter player name"
									maxLength={24}
									autoFocus
								/>
							</div>

							<div className="playerInfoActions">
								<button type="button" className="textButton" onClick={handleBackToColors}>
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
	)
}

export default PlayerInfoScreen
