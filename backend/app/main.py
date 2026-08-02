import asyncio
from copy import deepcopy
import random
import secrets
import time

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.game.board import Board
from app.game.pieces import ALL_PIECES
from app.game.rules import BOARD_SIZE, validate_move


app = FastAPI()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

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
turn_tasks = {}

BOT_MOVE_DELAY_SECONDS = 2


class MoveRequest(BaseModel):
    cells: list[dict]
    pieceName: str
    playerId: str
    playerToken: str


class JoinRequest(BaseModel):
    color: str
    adminToken: str | None = None


class PlayerSettingsRequest(BaseModel):
    color: str | None = None
    isBot: bool = False


class GameSettingsRequest(BaseModel):
    moveTimeLimitSeconds: int | None = None
    players: dict[str, PlayerSettingsRequest] = Field(default_factory=dict)


class CreateGameRequest(BaseModel):
    settings: GameSettingsRequest = Field(default_factory=GameSettingsRequest)


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


def make_runtime_player(seat, player_number, settings_player_key, is_bot=False):
    return {
        **deepcopy(seat),
        "id": f"p{player_number}",
        "settingsPlayerKey": settings_player_key,
        "token": None if is_bot else secrets.token_urlsafe(16),
        "pieces": make_piece_set(),
        "connected": is_bot,
        "isBot": is_bot,
        "isOutOfMoves": False,
        "joinedOrder": None if is_bot else player_number,
    }


def normalize_game_settings(settings):
    allowed_time_limits = {None, 30, 60, 90}
    if settings.moveTimeLimitSeconds not in allowed_time_limits:
        raise HTTPException(
            status_code=422,
            detail="Time limit must be no limit, 30, 60, or 90 seconds.",
        )

    players = {}
    for index in range(1, len(PLAYER_COLORS) + 1):
        player_key = f"Player {index}"
        supplied_player = settings.players.get(player_key)
        players[player_key] = {
            "color": None,
            "isBot": supplied_player.isBot if supplied_player else False,
        }

    if all(player["isBot"] for player in players.values()):
        raise HTTPException(
            status_code=422,
            detail="At least one player must be human.",
        )

    return {
        "moveTimeLimitSeconds": settings.moveTimeLimitSeconds,
        "players": players,
    }


def create_game_state(game_id, settings):
    return {
        "gameId": game_id,
        "settings": normalize_game_settings(settings),
        "adminPlayerId": None,
        "adminToken": secrets.token_urlsafe(24),
        "board": Board(),
        "players": [],
        "currentTurnIndex": 0,
        "turnNumber": 0,
        "turnEndsAt": None,
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
        "settingsPlayerKey": player["settingsPlayerKey"],
        "isBot": player.get("isBot", False),
    }


def game_snapshot(game):
    current_player_id = None

    if game["status"] == "playing" and game["players"]:
        current_player_id = game["players"][game["currentTurnIndex"]]["id"]

    return {
        "gameId": game["gameId"],
        "inviteCode": game["gameId"],
        "settings": game["settings"],
        "adminPlayerId": game["adminPlayerId"],
        "board": game["board"].get_grid(),
        "players": [public_player(player) for player in game["players"]],
        "currentPlayerId": current_player_id,
        "turnNumber": game["turnNumber"],
        "turnEndsAt": game["turnEndsAt"],
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

    if not player or player.get("isBot") or player["token"] != player_token:
        raise HTTPException(status_code=403, detail="Invalid player credentials.")

    return player


def settings_player_number(player_key):
    return int(player_key.rsplit(" ", 1)[1])


def start_game_if_ready(game):
    if game["hasStarted"]:
        return False

    human_settings = [
        player_settings
        for player_settings in game["settings"]["players"].values()
        if not player_settings["isBot"]
    ]
    if any(player_settings["color"] is None for player_settings in human_settings):
        return False

    used_colors = {
        player_settings["color"]
        for player_settings in game["settings"]["players"].values()
        if player_settings["color"] is not None
    }
    available_seats = [
        seat for seat in PLAYER_COLORS
        if seat["name"] not in used_colors
    ]
    runtime_player_keys = {
        player["settingsPlayerKey"]
        for player in game["players"]
    }

    for player_key, player_settings in game["settings"]["players"].items():
        if not player_settings["isBot"] or player_key in runtime_player_keys:
            continue

        seat = available_seats.pop(0)
        player_settings["color"] = seat["name"]
        player_number = game["nextPlayerNumber"]
        game["nextPlayerNumber"] += 1
        game["players"].append(
            make_runtime_player(
                seat,
                player_number,
                settings_player_key=player_key,
                is_bot=True,
            )
        )

    game["players"].sort(
        key=lambda player: settings_player_number(player["settingsPlayerKey"])
    )
    game["currentTurnIndex"] = 0
    game["status"] = "playing"
    game["hasStarted"] = True
    game["notice"] = f'{game["players"][0]["name"]} goes first.'
    start_current_turn(game)
    return True


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

    if game["turnEndsAt"] is not None and time.time() * 1000 >= game["turnEndsAt"]:
        return {
            "valid": False,
            "reason": "Your turn time has expired.",
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

    for flipped in [False, True]:
        cells = [
            (row, -col if flipped else col)
            for row, col in piece["cells"]
        ]

        for rotation in [0, 90, 180, 270]:
            normalized = normalize_cells(rotate_cells(cells, rotation))
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


def valid_placements_for_piece(game, player, piece):
    is_first_move = not any(piece["placed"] for piece in player["pieces"])
    corner = player["corner"]

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
                    yield cells


def can_player_move(game, player):
    if game["status"] != "playing":
        return False

    for piece in player["pieces"]:
        if not piece["placed"] and next(
            valid_placements_for_piece(game, player, piece),
            None,
        ) is not None:
            return True

    return False


def choose_automatic_move(game, player, rng=random):
    available_pieces = [
        piece for piece in player["pieces"]
        if not piece["placed"]
    ]
    rng.shuffle(available_pieces)

    for piece in available_pieces:
        selected_cells = None
        placement_count = 0

        for cells in valid_placements_for_piece(game, player, piece):
            placement_count += 1
            if rng.randrange(placement_count) == 0:
                selected_cells = cells

        if selected_cells is not None:
            return {
                "pieceName": piece["name"],
                "cells": selected_cells,
            }

    return None


def choose_random_bot_move(game, player, rng=random):
    return choose_automatic_move(game, player, rng)


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
    game["turnEndsAt"] = None
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
            start_current_turn(game)
            return


def start_current_turn(game):
    existing_task = turn_tasks.pop(game["gameId"], None)
    if existing_task and not existing_task.done():
        try:
            current_task = asyncio.current_task()
        except RuntimeError:
            current_task = None
        if existing_task is not current_task:
            existing_task.cancel()

    game["turnNumber"] += 1
    time_limit = game["settings"]["moveTimeLimitSeconds"]
    game["turnEndsAt"] = (
        time.time() * 1000 + time_limit * 1000
        if game["status"] == "playing" and time_limit is not None
        else None
    )


def apply_move(game, player, piece_name, cells, source="human"):
    game["board"].place_piece(
        cells,
        player=player["id"],
        color=player["color"],
        piece_id=f'{player["id"]}-{piece_name}',
    )

    piece = next(piece for piece in player["pieces"] if piece["name"] == piece_name)
    piece["placed"] = True
    game["moveHistory"].append({
        "playerId": player["id"],
        "pieceName": piece_name,
        "cells": cells,
        "source": source,
    })
    refresh_out_of_moves(game)
    advance_turn(game)


async def run_automatic_turn(
    game_id,
    expected_player_id,
    expected_turn_number,
    delay_seconds,
    source,
):
    current_task = asyncio.current_task()

    try:
        await asyncio.sleep(delay_seconds)
        game = games.get(game_id)

        if (
            not game
            or game["status"] != "playing"
            or not game["players"]
        ):
            return

        player = game["players"][game["currentTurnIndex"]]
        if (
            player["id"] != expected_player_id
            or game["turnNumber"] != expected_turn_number
            or (source == "bot" and not player.get("isBot"))
            or (source == "timeout" and player.get("isBot"))
        ):
            return

        move = choose_automatic_move(game, player)
        if move is None:
            player["isOutOfMoves"] = True
            game["notice"] = f'{player["name"]} ran out of moves.'
            refresh_out_of_moves(game)
            advance_turn(game)
        else:
            apply_move(game, player, move["pieceName"], move["cells"], source=source)
            if source == "timeout" and game["status"] == "playing":
                game["notice"] = (
                    f'{player["name"]} ran out of time. '
                    "A piece was placed automatically."
                )

        await broadcast_game(game_id)
    finally:
        if turn_tasks.get(game_id) is current_task:
            turn_tasks.pop(game_id, None)

    schedule_turn(game_id)


async def run_bot_turn(game_id, expected_player_id):
    game = games.get(game_id)
    if not game:
        return
    await run_automatic_turn(
        game_id,
        expected_player_id,
        game["turnNumber"],
        BOT_MOVE_DELAY_SECONDS,
        "bot",
    )


def schedule_turn(game_id):
    existing_task = turn_tasks.get(game_id)
    if existing_task and not existing_task.done():
        return

    game = games.get(game_id)
    if (
        not game
        or game["status"] != "playing"
        or not game["players"]
    ):
        return

    player = game["players"][game["currentTurnIndex"]]
    if player.get("isBot"):
        delay_seconds = BOT_MOVE_DELAY_SECONDS
        source = "bot"
    elif game["turnEndsAt"] is not None:
        delay_seconds = max(0, (game["turnEndsAt"] - time.time() * 1000) / 1000)
        source = "timeout"
    else:
        return

    turn_tasks[game_id] = asyncio.create_task(
        run_automatic_turn(
            game_id,
            player["id"],
            game["turnNumber"],
            delay_seconds,
            source,
        )
    )


def convert_player_to_bot(game, player):
    was_admin = game["adminPlayerId"] == player["id"]
    settings_player = game["settings"]["players"][player["settingsPlayerKey"]]
    settings_player["isBot"] = True
    player["isBot"] = True
    player["connected"] = True
    player["token"] = None

    remaining_humans = [
        joined_player
        for joined_player in game["players"]
        if not joined_player.get("isBot")
    ]

    if not remaining_humans:
        finish_game(game)
        game["adminPlayerId"] = None
        game["notice"] = (
            f'{player["name"]} left the game and became a bot. '
            "The game ended because no human players remain."
        )
        task = turn_tasks.pop(game["gameId"], None)
        if task and not task.done():
            task.cancel()
        return

    if was_admin:
        new_admin = min(
            remaining_humans,
            key=lambda joined_player: joined_player["joinedOrder"],
        )
        game["adminPlayerId"] = new_admin["id"]
        game["notice"] = (
            f'{player["name"]} left the game and became a bot. '
            f'{new_admin["name"]} is now the admin.'
        )
    else:
        game["notice"] = f'{player["name"]} left the game and became a bot.'


@app.post("/games")
def create_game(request: CreateGameRequest | None = None):
    game_id = f"{secrets.randbelow(1_000_000):06d}"
    while game_id in games:
        game_id = f"{secrets.randbelow(1_000_000):06d}"
    settings = request.settings if request else GameSettingsRequest()
    games[game_id] = create_game_state(game_id, settings)
    connections[game_id] = set()
    return {
        **game_snapshot(games[game_id]),
        "adminToken": games[game_id]["adminToken"],
    }


@app.get("/games/{game_id}")
def get_game_state(game_id: str):
    return game_snapshot(get_game_or_404(game_id))


@app.post("/games/{game_id}/join")
async def join_game(game_id: str, request: JoinRequest):
    game = get_game_or_404(game_id)

    if request.adminToken:
        if request.adminToken != game["adminToken"]:
            raise HTTPException(status_code=403, detail="Invalid admin credentials.")
        if game["adminPlayerId"] is not None:
            raise HTTPException(status_code=409, detail="This game already has an admin.")

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
    settings_player_key = next(
        (
            player_key
            for player_key, player_settings in game["settings"]["players"].items()
            if not player_settings["isBot"] and player_settings["color"] is None
        ),
        None,
    )
    if settings_player_key is None:
        raise HTTPException(status_code=409, detail="All human player slots are filled.")

    player = make_runtime_player(
        seat,
        player_number,
        settings_player_key=settings_player_key,
    )
    game["players"].append(player)
    game["settings"]["players"][player["settingsPlayerKey"]]["color"] = player["name"]

    if request.adminToken:
        game["adminPlayerId"] = player["id"]

    start_game_if_ready(game)

    await broadcast_game(game_id)
    schedule_turn(game_id)

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
    convert_player_to_bot(game, player)
    await broadcast_game(game_id)
    schedule_turn(game_id)
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
    start_current_turn(game)

    await broadcast_game(game_id)
    schedule_turn(game_id)

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

                apply_move(game, player, move.pieceName, move.cells)
                await broadcast_game(game_id)
                schedule_turn(game_id)

    except WebSocketDisconnect:
        connections[game_id].discard(websocket)
        if player in game["players"] and not player.get("isBot"):
            player["connected"] = False
        await broadcast_game(game_id)
