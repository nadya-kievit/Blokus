from fastapi.testclient import TestClient

from app.main import app, finish_game, games, refresh_out_of_moves


client = TestClient(app)


def setup_function():
    games.clear()


def create_joined_game():
    game_id = client.post("/games").json()["gameId"]
    players = [
        client.post(f"/games/{game_id}/join", json={"color": color}).json()
        for color in ["Blue", "Red", "Green", "Yellow"]
    ]
    return game_id, players


def move_payload(player, piece_name, cells):
    return {
        "playerId": player["playerId"],
        "playerToken": player["playerToken"],
        "pieceName": piece_name,
        "cells": cells,
    }


def place_piece(game_id, player, piece_name, cells):
    with client.websocket_connect(
        f"/games/{game_id}/ws?playerId={player['playerId']}&token={player['playerToken']}"
    ) as websocket:
        websocket.receive_json()
        websocket.send_json({
            "type": "place_piece",
            "pieceName": piece_name,
            "cells": cells,
        })

        for _ in range(4):
            message = websocket.receive_json()
            if message["type"] == "error":
                return message
            if message["type"] == "game_state":
                return message


def test_creating_multiple_games_keeps_boards_isolated():
    first_game_id, first_players = create_joined_game()
    second_game_id, _ = create_joined_game()

    place_piece(first_game_id, first_players[0], "I1", [{"row": 0, "col": 0}])

    first_state = client.get(f"/games/{first_game_id}").json()
    second_state = client.get(f"/games/{second_game_id}").json()

    assert first_state["board"][0][0]["occupied"] is True
    assert first_state["board"][0][0]["pieceId"] == "p1-I1"
    assert second_state["board"][0][0]["occupied"] is False
    assert second_state["board"][0][0]["pieceId"] is None


def test_four_players_fill_seats_and_fifth_join_is_rejected():
    game_id, players = create_joined_game()
    response = client.post(f"/games/{game_id}/join", json={"color": "Blue"})

    assert [player["playerId"] for player in players] == ["p1", "p2", "p3", "p4"]
    assert response.status_code == 409


def test_game_uses_six_digit_invite_code_and_players_choose_colors():
    game_id = client.post("/games").json()["inviteCode"]
    red = client.post(f"/games/{game_id}/join", json={"color": "Red"})
    duplicate = client.post(f"/games/{game_id}/join", json={"color": "Red"})

    assert len(game_id) == 6 and game_id.isdigit()
    assert red.json()["name"] == "Red"
    assert duplicate.status_code == 409


def test_quitting_removes_player_and_their_board_pieces():
    game_id, players = create_joined_game()
    place_piece(game_id, players[0], "I1", [{"row": 0, "col": 0}])

    response = client.post(
        f"/games/{game_id}/quit",
        json={"playerId": players[0]["playerId"], "playerToken": players[0]["playerToken"]},
    )
    state = client.get(f"/games/{game_id}").json()

    assert response.json() == {"success": True}
    assert state["board"][0][0]["occupied"] is False
    assert len(state["players"]) == 3
    assert state["currentPlayerId"] == players[1]["playerId"]
    assert "left the game" in state["notice"]


def test_first_move_must_cover_player_corner():
    game_id, players = create_joined_game()
    response = client.post(
        f"/games/{game_id}/validate-move",
        json=move_payload(players[0], "I1", [{"row": 1, "col": 1}]),
    )

    assert response.json()["valid"] is False
    assert "starting corner" in response.json()["reason"]


def test_players_cannot_move_out_of_turn():
    game_id, players = create_joined_game()
    response = client.post(
        f"/games/{game_id}/validate-move",
        json=move_payload(players[1], "I1", [{"row": 0, "col": 19}]),
    )

    assert response.json() == {
        "valid": False,
        "reason": "It is not your turn.",
    }


def test_players_cannot_use_another_players_piece_after_they_place_it():
    game_id, players = create_joined_game()

    place_piece(game_id, players[0], "I1", [{"row": 0, "col": 0}])

    response = client.post(
        f"/games/{game_id}/validate-move",
        json=move_payload(players[1], "I1", [{"row": 0, "col": 19}]),
    )

    assert response.json()["valid"] is True


def test_same_color_diagonal_and_side_rules_are_enforced():
    game_id, players = create_joined_game()

    place_piece(game_id, players[0], "I1", [{"row": 0, "col": 0}])
    place_piece(game_id, players[1], "I1", [{"row": 0, "col": 19}])
    place_piece(game_id, players[2], "I1", [{"row": 19, "col": 19}])
    place_piece(game_id, players[3], "I1", [{"row": 19, "col": 0}])

    side_response = client.post(
        f"/games/{game_id}/validate-move",
        json=move_payload(
            players[0],
            "I2",
            [{"row": 0, "col": 1}, {"row": 0, "col": 2}],
        ),
    )
    diagonal_response = client.post(
        f"/games/{game_id}/validate-move",
        json=move_payload(
            players[0],
            "I2",
            [{"row": 1, "col": 1}, {"row": 1, "col": 2}],
        ),
    )

    assert side_response.json()["valid"] is False
    assert diagonal_response.json()["valid"] is True


def test_other_players_do_not_count_as_diagonal_contact():
    game_id, players = create_joined_game()

    place_piece(game_id, players[0], "I1", [{"row": 0, "col": 0}])
    place_piece(game_id, players[1], "I1", [{"row": 0, "col": 19}])
    place_piece(game_id, players[2], "I1", [{"row": 19, "col": 19}])
    place_piece(game_id, players[3], "I1", [{"row": 19, "col": 0}])

    response = client.post(
        f"/games/{game_id}/validate-move",
        json=move_payload(
            players[0],
            "I2",
            [{"row": 1, "col": 18}, {"row": 1, "col": 17}],
        ),
    )

    assert response.json() == {
        "valid": False,
        "reason": "Piece must touch one of your pieces diagonally.",
    }


def test_player_with_no_available_moves_is_marked_and_skipped():
    game_id, players = create_joined_game()
    game = games[game_id]
    game["board"].place_piece([{"row": 0, "col": 0}], player=players[1]["playerId"])

    refresh_out_of_moves(game)

    state = client.get(f"/games/{game_id}").json()
    blue = next(player for player in state["players"] if player["name"] == "Blue")

    assert state["status"] == "playing"
    assert blue["isOutOfMoves"] is True
    assert "Blue ran out of moves" in state["notice"]


def test_game_finishes_with_leaderboard_when_everyone_is_out_of_moves():
    game_id, _ = create_joined_game()
    game = games[game_id]

    for row in range(20):
        for col in range(20):
            game["board"].grid[row][col].update({"occupied": True, "player": "blocked"})

    for index, player in enumerate(game["players"]):
        for piece in player["pieces"][:index + 1]:
            piece["placed"] = True

    refresh_out_of_moves(game)
    state = client.get(f"/games/{game_id}").json()

    assert state["status"] == "finished"
    assert state["leaderboard"][0]["name"] == "Yellow"
    assert state["winnerId"] == game["players"][3]["id"]
    assert state["currentPlayerId"] is None


def test_finished_game_can_restart_with_same_players_and_winner_first():
    game_id, players = create_joined_game()
    game = games[game_id]
    game["board"].place_piece([{"row": 0, "col": 0}], player=players[1]["playerId"])

    for piece in game["players"][1]["pieces"][:3]:
        piece["placed"] = True

    finish_game(game)

    response = client.post(
        f"/games/{game_id}/restart",
        json={"playerId": players[0]["playerId"], "playerToken": players[0]["playerToken"]},
    )
    state = response.json()

    assert response.status_code == 200
    assert state["status"] == "playing"
    assert state["currentPlayerId"] == players[1]["playerId"]
    assert len(state["players"]) == 4
    assert state["board"][0][0]["occupied"] is False
    assert all(not piece["placed"] for player in state["players"] for piece in player["pieces"])
    assert "Red goes first" in state["notice"]
