import { useEffect, useState } from 'react'
import { GlobalStyles } from '@mui/material'
import { globalGameStyles } from './gameStyles'
import CreateGameScreen from './screens/CreateGameScreen'
import GameSettingsScreen from './screens/GameSettingsScreen'
import ChooseColorScreen from './screens/ChooseColorScreen'
import GameScreen from './screens/GameScreen'

function getRouteFromPath(pathname) {
	const gameMatch = pathname.match(/^\/game\/([^/]+)$/)

	if (gameMatch) {
		return {
			screen: 'game',
			gameId: gameMatch[1],
		}
	}

	return {
		screen: 'createGame',
		gameId: null,
	}
}

function getStoredPlayer(gameId) {
	const stored = localStorage.getItem(`blokus-player-${gameId}`)
	return stored ? JSON.parse(stored) : null
}

function App() {
	const globalStyles = <GlobalStyles styles={globalGameStyles} />
	const [path, setPath] = useState(window.location.pathname)
	const [prefetchedGame, setPrefetchedGame] = useState(null)
	const [playerSessionVersion, setPlayerSessionVersion] = useState(0)
	const [isConfiguringGame, setIsConfiguringGame] = useState(false)
	const route = getRouteFromPath(path)
	const hasPlayerCredentials =
		route.gameId && Boolean(getStoredPlayer(route.gameId))

	useEffect(() => {
		const handlePopState = () => {
			setPath(window.location.pathname)
		}

		window.addEventListener('popstate', handlePopState)

		return () => {
			window.removeEventListener('popstate', handlePopState)
		}
	}, [])

	const navigateTo = nextPath => {
		window.history.pushState({}, '', nextPath)
		setPath(nextPath)
	}

	const handleEnterGame = gameOrGameId => {
		setIsConfiguringGame(false)

		if (typeof gameOrGameId === 'string') {
			setPrefetchedGame(null)
			navigateTo(`/game/${gameOrGameId}`)
			return
		}

		if (gameOrGameId.adminToken) {
			localStorage.setItem(
				`blokus-admin-${gameOrGameId.gameId}`,
				gameOrGameId.adminToken,
			)
		}

		setPrefetchedGame(gameOrGameId)
		navigateTo(`/game/${gameOrGameId.gameId}`)
	}

	const handleStartPlaying = () => {
		setPlayerSessionVersion(version => version + 1)
	}

	const handleLeaveGame = () => {
		navigateTo('/')
	}

	if (route.screen === 'createGame') {
		return (
			<>
				{globalStyles}
				{isConfiguringGame ? (
					<GameSettingsScreen
						onCreateRoom={handleEnterGame}
						onBack={() => setIsConfiguringGame(false)}
					/>
				) : (
					<CreateGameScreen
						onEnterGame={handleEnterGame}
						onConfigureGame={() => setIsConfiguringGame(true)}
					/>
				)}
			</>
		)
	}

	if (!hasPlayerCredentials) {
		return (
			<>
				{globalStyles}
				<ChooseColorScreen
					gameId={route.gameId}
					initialGame={prefetchedGame?.gameId === route.gameId ? prefetchedGame : null}
					onJoined={handleStartPlaying}
					onBack={handleLeaveGame}
				/>
			</>
		)
	}

	return (
		<>
			{globalStyles}
			<GameScreen
				key={`${route.gameId}-${playerSessionVersion}`}
				gameId={route.gameId}
				onLeaveGame={handleLeaveGame}
				onNeedsColor={() => setPlayerSessionVersion(version => version + 1)}
			/>
		</>
	)
}

export default App
