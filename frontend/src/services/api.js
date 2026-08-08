const removeTrailingSlash = (url) => url.replace(/\/+$/, '')

const API_BASE = removeTrailingSlash(
  	import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'
)

const WS_BASE = removeTrailingSlash(
  	import.meta.env.VITE_WS_BASE || 'ws://127.0.0.1:8000'
)


export async function wakeGameServer() {
	await fetch(`${API_BASE}/health`)
}


async function parseResponse(response) {
	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.detail || 'Request failed.')
	}

	return data
}


export async function createGame(settings) {
	const response = await fetch(`${API_BASE}/games`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ settings })
	})

	return parseResponse(response)
}


export async function getGame(gameId) {
	const response = await fetch(`${API_BASE}/games/${gameId}`)

	return parseResponse(response)
}


export async function joinGame(gameId, color, name, adminToken) {
	const response = await fetch(`${API_BASE}/games/${gameId}/join`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ color, name, adminToken })
	})

	return parseResponse(response)
}


export async function quitGame(gameId, credentials) {
	const response = await fetch(`${API_BASE}/games/${gameId}/quit`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(credentials)
	})

	return parseResponse(response)
}


export async function restartGame(gameId, credentials) {
	const response = await fetch(`${API_BASE}/games/${gameId}/restart`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(credentials)
	})

	return parseResponse(response)
}


export function gameSocketUrl(gameId, credentials) {
	const params = new URLSearchParams({
		playerId: credentials.playerId,
		token: credentials.playerToken
	})

	return `${WS_BASE}/games/${gameId}/ws?${params.toString()}`
}
