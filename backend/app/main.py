from copy import deepcopy
import secrets

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.game.board import Board
from app.game.pieces import ALL_PIECES
from app.game.rules import BOARD_SIZE, validate_move


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


PLAYER_COLORS = [
    {
        "id": "p1",
        "name": "Blue",
        "color": "#0077ee",
        "corner": {"row": 0, "col": 0},
    },
    {
        "id": "p2",
        "name": "Red",
        "color": "#e34242",
        "corner": {"row": 0, "col": BOARD_SIZE - 1},
    },
    {
        "id": "p3",
        "name": "Green",
        "color": "#28a745",
        "corner": {"row": BOARD_SIZE - 1, "col": BOARD_SIZE - 1},
    },
    {
        "id": "p4",
        "name": "Yellow",
        "color": "#f3b51b",
        "corner": {"row": BOARD_SIZE - 1, "col": 0},
    },
]

games = {}
connections = {}


class MoveRequest(BaseModel):
    cells: list[dict]
    pieceName: str
    playerId: str
    playerToken: str


class JoinRequest(BaseModel):
    color: str


class QuitRequest(BaseModel):
    playerId: str
    playerToken: str


def make_piece_set():
    return [
        {
            "name": piece.name,
            "cells": list(piece.cells),
            "placed": False,
        }
        for piece in ALL_PIECES
    ]


def create_game_state(game_id):
    return {
        "gameId": game_id,
        "board": Board(),
        "players": [],
        "currentTurnIndex": 0,
        "moveHistory": [],
        "status": "waiting",
        "hasStarted": False,
        "nextPlayerNumber": 1,
        "notice": None,
    }


def public_player(player):
    return {
        "id": player["id"],
        "name": player["name"],
        "color": player["color"],
        "corner": player["corner"],
        "connected": player["connected"],
        "pieces": player["pieces"],
    }


def game_snapshot(game):
    current_player_id = None

    if game["status"] == "playing" and game["players"]:
        current_player_id = game["players"][game["currentTurnIndex"]]["id"]

    return {
        "gameId": game["gameId"],
        "board": game["board"].get_grid(),
        "players": [public_player(player) for player in game["players"]],
        "currentPlayerId": current_player_id,
        "moveHistory": game["moveHistory"],
        "status": game["status"],
        "availableColors": [
            seat for seat in PLAYER_COLORS
            if not any(player["name"] == seat["name"] for player in game["players"])
        ],
        "notice": game["notice"],
    }


def get_game_or_404(game_id):
    game = games.get(game_id)

    if not game:
        raise HTTPException(status_code=404, detail="Game not found.")

    return game


def get_player(game, player_id):
    for player in game["players"]:
        if player["id"] == player_id:
            return player

    return None


def authenticate_player(game, player_id, player_token):
    player = get_player(game, player_id)

    if not player or player["token"] != player_token:
        raise HTTPException(status_code=403, detail="Invalid player credentials.")

    return player


def validate_player_move(game, player, move):
    if game["status"] != "playing":
        return {
            "valid": False,
            "reason": "Game starts after all four players join.",
        }

    current_player = game["players"][game["currentTurnIndex"]]

    if current_player["id"] != player["id"]:
        return {
            "valid": False,
            "reason": "It is not your turn.",
        }

    piece = next(
        (piece for piece in player["pieces"] if piece["name"] == move.pieceName),
        None,
    )

    if not piece:
        return {
            "valid": False,
            "reason": "That piece does not belong to this player.",
        }

    if piece["placed"]:
        return {
            "valid": False,
            "reason": "That piece has already been placed.",
        }

    is_first_move = not any(piece["placed"] for piece in player["pieces"])
    corner = player["corner"]

    return validate_move(
        board_grid=game["board"].get_grid(),
        cells=move.cells,
        is_first_move=is_first_move,
        player_id=player["id"],
        first_corner=(corner["row"], corner["col"]),
    )


async def broadcast_game(game_id):
    sockets = list(connections.get(game_id, []))
    if not sockets:
        return

    snapshot = game_snapshot(games[game_id])

    stale_sockets = []
    for socket in sockets:
        try:
            await socket.send_json({
                "type": "game_state",
                "game": snapshot,
            })
        except RuntimeError:
            stale_sockets.append(socket)

    for socket in stale_sockets:
        connections[game_id].discard(socket)


def advance_turn(game):
    game["currentTurnIndex"] = (game["currentTurnIndex"] + 1) % len(game["players"])


def remove_player_from_game(game, player):
    removed_index = game["players"].index(player)
    current_player_id = None
    next_player_id = None
    if game["status"] == "playing" and game["players"]:
        current_player_id = game["players"][game["currentTurnIndex"]]["id"]
        next_player_id = game["players"][(removed_index + 1) % len(game["players"])]["id"]

    for row in game["board"].grid:
        for cell in row:
            if cell.get("player") == player["id"]:
                cell.clear()
                cell.update({"occupied": False, "player": None})

    game["players"].remove(player)
    game["moveHistory"] = [
        move for move in game["moveHistory"] if move["playerId"] != player["id"]
    ]

    if not game["players"]:
        game["status"] = "waiting"
        game["currentTurnIndex"] = 0
    elif game["hasStarted"]:
        game["status"] = "playing"
        desired_player_id = next_player_id if current_player_id == player["id"] else current_player_id
        game["currentTurnIndex"] = next(
            (index for index, joined in enumerate(game["players"]) if joined["id"] == desired_player_id),
            0,
        )

    game["notice"] = f'{player["name"]} left the game. Their pieces were removed.'


@app.post("/games")
def create_game():
    game_id = f"{secrets.randbelow(1_000_000):06d}"
    while game_id in games:
        game_id = f"{secrets.randbelow(1_000_000):06d}"
    games[game_id] = create_game_state(game_id)
    connections[game_id] = set()
    return game_snapshot(games[game_id])


@app.get("/games/{game_id}")
def get_game_state(game_id: str):
    return game_snapshot(get_game_or_404(game_id))


@app.post("/games/{game_id}/join")
async def join_game(game_id: str, request: JoinRequest):
    game = get_game_or_404(game_id)

    if len(game["players"]) >= len(PLAYER_COLORS):
        raise HTTPException(status_code=409, detail="This game already has four players.")

    seat = next(
        (deepcopy(seat) for seat in PLAYER_COLORS if seat["name"].lower() == request.color.lower()),
        None,
    )
    if not seat:
        raise HTTPException(status_code=400, detail="Choose one of the available colors.")
    if any(player["name"] == seat["name"] for player in game["players"]):
        raise HTTPException(status_code=409, detail="That color has already been chosen.")

    player_number = game["nextPlayerNumber"]
    game["nextPlayerNumber"] += 1
    player = {
        **seat,
        "id": f"p{player_number}",
        "token": secrets.token_urlsafe(16),
        "pieces": make_piece_set(),
        "connected": False,
    }

    game["players"].append(player)

    if len(game["players"]) == len(PLAYER_COLORS):
        game["status"] = "playing"
        game["hasStarted"] = True

    await broadcast_game(game_id)

    return {
        "playerId": player["id"],
        "playerToken": player["token"],
        "color": player["color"],
        "name": player["name"],
    }


@app.post("/games/{game_id}/quit")
async def quit_game(game_id: str, request: QuitRequest):
    game = get_game_or_404(game_id)
    player = authenticate_player(game, request.playerId, request.playerToken)
    remove_player_from_game(game, player)
    await broadcast_game(game_id)
    return {"success": True}


@app.post("/games/{game_id}/validate-move")
def validate_move_endpoint(game_id: str, move: MoveRequest):
    game = get_game_or_404(game_id)
    player = authenticate_player(game, move.playerId, move.playerToken)

    return validate_player_move(game, player, move)


@app.websocket("/games/{game_id}/ws")
async def game_websocket(websocket: WebSocket, game_id: str, playerId: str, token: str):
    game = games.get(game_id)

    if not game:
        await websocket.close(code=1008)
        return

    player = get_player(game, playerId)

    if not player or player["token"] != token:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    connections.setdefault(game_id, set()).add(websocket)
    player["connected"] = True
    await broadcast_game(game_id)

    try:
        while True:
            message = await websocket.receive_json()
            action = message.get("type")

            if action == "request_state":
                await websocket.send_json({
                    "type": "game_state",
                    "game": game_snapshot(game),
                })

            if action == "place_piece":
                move = MoveRequest(
                    cells=message.get("cells", []),
                    pieceName=message.get("pieceName", ""),
                    playerId=playerId,
                    playerToken=token,
                )
                result = validate_player_move(game, player, move)

                if not result["valid"]:
                    await websocket.send_json({
                        "type": "error",
                        "reason": result["reason"],
                    })
                    continue

                game["board"].place_piece(move.cells, player=player["id"], color=player["color"])

                for piece in player["pieces"]:
                    if piece["name"] == move.pieceName:
                        piece["placed"] = True

                game["moveHistory"].append({
                    "playerId": player["id"],
                    "pieceName": move.pieceName,
                    "cells": move.cells,
                })
                advance_turn(game)
                await broadcast_game(game_id)

    except WebSocketDisconnect:
        connections[game_id].discard(websocket)
        if player in game["players"]:
            player["connected"] = False
        await broadcast_game(game_id)
