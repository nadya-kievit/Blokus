import { useEffect, useState } from 'react'
import CreateGameScreen from './screens/CreateGameScreen'
import GameSettingsScreen from './screens/GameSettingsScreen'
import PlayerInfoScreen from './screens/PlayerInfoScreen'
import GameScreen from './screens/GameScreen'


// Based on the current URL, set which screen should be displayed
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


// Retrieves the saved player credentials for a game from browser storage
function getStoredPlayer(gameId) {
	const stored = localStorage.getItem(`blokus-player-${gameId}`)
	return stored ? JSON.parse(stored) : null
}


function App() {
	const [path, setPath] = useState(window.location.pathname)
	const [prefetchedGame, setPrefetchedGame] = useState(null)
	const [playerSessionVersion, setPlayerSessionVersion] = useState(0)
	const [isConfiguringGame, setIsConfiguringGame] = useState(false)

	const route = getRouteFromPath(path)
	const hasPlayerCredentials = route.gameId && Boolean(getStoredPlayer(route.gameId))


	// Keeps React's route state in sync when the user navigates with Back or Forward
	useEffect(() => {
		// Copies the browser's current path into state after a history navigation event
		const handlePopState = () => {
			setPath(window.location.pathname)
		}

		window.addEventListener('popstate', handlePopState)

		return () => {
			window.removeEventListener('popstate', handlePopState)
		}
	}, [])


	// Adds a URL to browser history and immediately updates the rendered route
	const navigateTo = nextPath => {
		window.history.pushState({}, '', nextPath)
		setPath(nextPath)
	}


	// Saves any host credentials and navigates to the selected or newly created game
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


	// Refreshes the game route after the player has selected a color and joined
	const handleStartPlaying = () => {
		setPlayerSessionVersion(version => version + 1)
	}


	// Returns the player to the application's landing screen
	const handleLeaveGame = () => {
		navigateTo('/')
	}

	if (route.screen === 'createGame') {
		return (
			<>
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
			<PlayerInfoScreen
				gameId={route.gameId}
				initialGame={prefetchedGame?.gameId === route.gameId ? prefetchedGame : null}
				onJoined={handleStartPlaying}
				onBack={handleLeaveGame}
			/>
		)
	}

	return (
		<GameScreen
			key={`${route.gameId}-${playerSessionVersion}`}
			gameId={route.gameId}
			onLeaveGame={handleLeaveGame}
			onNeedsColor={() => setPlayerSessionVersion(version => version + 1)}
		/>
	)
}

export default App
