const API_BASE = 'http://127.0.0.1:8000'

export async function getGameState() {

  const response = await fetch(`${API_BASE}/game/state`)

  return await response.json()
}

export async function testMove(row, col) {

  const response = await fetch(`${API_BASE}/game/test-move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      row,
      col
    })
  })

  return await response.json()
}

export async function getPieces() {

  const response = await fetch(`${API_BASE}/game/pieces`)

  return await response.json()
}