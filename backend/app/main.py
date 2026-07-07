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


class RestartRequest(BaseModel):
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
        "winnerId": None,
        "leaderboard": [],
    }


def public_player(player):
    return {
        "id": player["id"],
        "name": player["name"],
        "color": player["color"],
        "corner": player["corner"],
        "connected": player["connected"],
        "pieces": player["pieces"],
        "isOutOfMoves": player.get("isOutOfMoves", False),
    }


def game_snapshot(game):
    current_player_id = None

    if game["status"] == "playing" and game["players"]:
        current_player_id = game["players"][game["currentTurnIndex"]]["id"]

    return {
        "gameId": game["gameId"],
        "inviteCode": game["gameId"],
        "board": game["board"].get_grid(),
        "players": [public_player(player) for player in game["players"]],
        "currentPlayerId": current_player_id,
        "moveHistory": game["moveHistory"],
        "status": game["status"],
        "winnerId": game["winnerId"],
        "leaderboard": game["leaderboard"],
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
            "reason": "This game is not accepting moves.",
        }

    if player.get("isOutOfMoves"):
        return {
            "valid": False,
            "reason": "You are out of moves.",
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


def normalize_cells(cells):
    min_row = min(row for row, _ in cells)
    min_col = min(col for _, col in cells)
    return tuple(sorted((row - min_row, col - min_col) for row, col in cells))


def rotate_cells(cells, rotation):
    rotated = []

    for row, col in cells:
        if rotation == 90:
            rotated.append((-col, row))
        elif rotation == 180:
            rotated.append((-row, -col))
        elif rotation == 270:
            rotated.append((col, -row))
        else:
            rotated.append((row, col))

    return rotated


def piece_orientations(piece):
    orientations = []
    seen = set()

    for rotation in [0, 90, 180, 270]:
        normalized = normalize_cells(rotate_cells(piece["cells"], rotation))
        if normalized not in seen:
            seen.add(normalized)
            orientations.append(normalized)

    return orientations


def player_block_count(player):
    return sum(
        len(piece["cells"])
        for piece in player["pieces"]
        if piece["placed"]
    )


def can_player_move(game, player):
    if game["status"] != "playing":
        return False

    is_first_move = not any(piece["placed"] for piece in player["pieces"])
    corner = player["corner"]

    for piece in player["pieces"]:
        if piece["placed"]:
            continue

        for orientation in piece_orientations(piece):
            max_row = max(row for row, _ in orientation)
            max_col = max(col for _, col in orientation)

            for row_offset in range(BOARD_SIZE - max_row):
                for col_offset in range(BOARD_SIZE - max_col):
                    cells = [
                        {
                            "row": row + row_offset,
                            "col": col + col_offset,
                        }
                        for row, col in orientation
                    ]
                    result = validate_move(
                        board_grid=game["board"].get_grid(),
                        cells=cells,
                        is_first_move=is_first_move,
                        player_id=player["id"],
                        first_corner=(corner["row"], corner["col"]),
                    )

                    if result["valid"]:
                        return True

    return False


def make_leaderboard(game):
    leaderboard = [
        {
            "playerId": player["id"],
            "name": player["name"],
            "color": player["color"],
            "blocksPlaced": player_block_count(player),
        }
        for player in game["players"]
    ]
    leaderboard.sort(key=lambda entry: entry["blocksPlaced"], reverse=True)
    return leaderboard


def finish_game(game):
    leaderboard = make_leaderboard(game)
    winner = leaderboard[0] if leaderboard else None

    game["status"] = "finished"
    game["winnerId"] = winner["playerId"] if winner else None
    game["leaderboard"] = leaderboard
    game["currentTurnIndex"] = 0
    if winner:
        game["notice"] = f'Game over. {winner["name"]} won with {winner["blocksPlaced"]} blocks.'
    else:
        game["notice"] = "Game over."


def refresh_out_of_moves(game):
    newly_out = []

    if game["status"] != "playing":
        return newly_out

    for player in game["players"]:
        if player.get("isOutOfMoves"):
            continue

        if not can_player_move(game, player):
            player["isOutOfMoves"] = True
            newly_out.append(player)

    if newly_out:
        names = ", ".join(player["name"] for player in newly_out)
        game["notice"] = f"{names} ran out of moves. Their turns will be skipped."

    if game["players"] and all(player.get("isOutOfMoves") for player in game["players"]):
        finish_game(game)

    return newly_out


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
    if game["status"] != "playing" or not game["players"]:
        return

    for offset in range(1, len(game["players"]) + 1):
        next_index = (game["currentTurnIndex"] + offset) % len(game["players"])

        if not game["players"][next_index].get("isOutOfMoves"):
            game["currentTurnIndex"] = next_index
            return


def remove_player_from_game(game, player):
    removed_index = game["players"].index(player)
    was_finished = game["status"] == "finished"
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
        game["winnerId"] = None
        game["leaderboard"] = []
    elif was_finished:
        finish_game(game)
    elif game["hasStarted"]:
        game["status"] = "playing"
        desired_player_id = next_player_id if current_player_id == player["id"] else current_player_id
        game["currentTurnIndex"] = next(
            (index for index, joined in enumerate(game["players"]) if joined["id"] == desired_player_id),
            0,
        )
        game["winnerId"] = None
        game["leaderboard"] = []

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
        "isOutOfMoves": False,
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


@app.post("/games/{game_id}/restart")
async def restart_game(game_id: str, request: RestartRequest):
    game = get_game_or_404(game_id)
    player = authenticate_player(game, request.playerId, request.playerToken)

    if game["status"] != "finished":
        raise HTTPException(status_code=409, detail="Only finished games can be restarted.")

    winner_id = game["winnerId"]
    game["board"] = Board()
    game["moveHistory"] = []
    game["status"] = "playing"
    game["hasStarted"] = True
    game["winnerId"] = None
    game["leaderboard"] = []

    for joined_player in game["players"]:
        joined_player["pieces"] = make_piece_set()
        joined_player["isOutOfMoves"] = False

    game["currentTurnIndex"] = next(
        (index for index, joined_player in enumerate(game["players"]) if joined_player["id"] == winner_id),
        game["players"].index(player),
    )
    first_player = game["players"][game["currentTurnIndex"]]
    game["notice"] = f'New game started. {first_player["name"]} goes first.'

    await broadcast_game(game_id)

    return game_snapshot(game)


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
                refresh_out_of_moves(game)
                advance_turn(game)
                await broadcast_game(game_id)

    except WebSocketDisconnect:
        connections[game_id].discard(websocket)
        if player in game["players"]:
            player["connected"] = False
        await broadcast_game(game_id)
