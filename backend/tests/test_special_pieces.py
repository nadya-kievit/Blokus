import random

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.game.board import Board
from app.game.board_layouts import BOARD_CONFIGS, get_board_config
from app.game.pieces import ALL_PIECES
from app.game.rules import validate_move


@pytest.fixture(autouse=True)
def isolate_games(monkeypatch):
    for task in main.turn_tasks.values():
        task.cancel()
    main.turn_tasks.clear()
    main.games.clear()
    main.connections.clear()
    monkeypatch.setattr(main, "choose_starting_player_index", lambda count: 0)
    monkeypatch.setattr(main, "choose_start_positions", lambda positions, count: positions[:count])
    monkeypatch.setattr(main, "schedule_turn", lambda game_id: None)


def assignments(pieces):
    return {piece["name"]: piece["ability"] for piece in pieces if piece.get("ability")}


def create_game(client, layout="square", player_count=2, bots=False):
    created = client.post("/games", json={"settings": {
        "boardLayout": layout,
        "playerCount": player_count,
        "players": {
            f"Player {index}": {"isBot": bots and index > 1}
            for index in range(1, player_count + 1)
        },
    }}).json()
    credentials = []
    for color in (["Blue"] if bots else [option["color"] for option in main.PLAYER_COLORS[:player_count]]):
        response = client.post(f'/games/{created["gameId"]}/join', json={"color": color})
        assert response.status_code == 200
        credentials.append(response.json())
    return main.games[created["gameId"]], credentials


def own_headers(credentials):
    return {
        "X-Player-Id": credentials["playerId"],
        "X-Player-Token": credentials["playerToken"],
    }


def assert_private_snapshot(snapshot, viewer_id=None):
    for player in snapshot["players"]:
        specials = assignments(player["pieces"])
        if player["id"] == viewer_id:
            owner = next(
                candidate for candidate in main.games[snapshot["gameId"]]["players"]
                if candidate["id"] == viewer_id
            )
            expected = assignments([piece for piece in owner["pieces"] if not piece["placed"]])
            assert specials == expected
        else:
            assert specials == {}


def test_assignments_are_distinct_independent_and_do_not_modify_shapes(monkeypatch):
    seeded_rng = random.Random(147)
    monkeypatch.setattr(main.random, "sample", seeded_rng.sample)
    piece_sets = [main.make_piece_set() for _ in range(20)]
    expected_shapes = {piece.name: list(piece.cells) for piece in ALL_PIECES}
    assert len(expected_shapes) == 16
    for pieces in piece_sets:
        assert len(pieces) == 16
        assert {piece["name"]: piece["cells"] for piece in pieces} == expected_shapes
        assert sorted(assignments(pieces).values()) == ["connector", "scout"]
        assert all(not piece["placed"] for piece in pieces)
    assert len({tuple(sorted(assignments(pieces).items())) for pieces in piece_sets}) > 1
    assert all(not hasattr(piece, "ability") for piece in ALL_PIECES)


@pytest.mark.parametrize("ability", [None, "scout", "connector"])
@pytest.mark.parametrize("position,allowed", [
    ((0, 0), {"scout"}),
    ((3, 4), {"connector"}),
    ((4, 4), {None, "scout", "connector"}),
    ((3, 7), {"scout"}),  # Contact with an opponent is not own contact.
    ((4, 7), {"scout"}),
    ((3, 3), set()),
    ((3, 8), set()),
    ((5, 5), set()),
    ((12, 0), set()),
    ((0, -1), set()),
])
def test_special_placement_rules(ability, position, allowed):
    board = Board(get_board_config("square", 2))
    board.place_piece([{"row": 3, "col": 3}], player="p1")
    board.place_piece([{"row": 3, "col": 8}], player="p2")
    board.grid[5][5]["playable"] = False
    row, col = position
    result = validate_move(board.grid, [{"row": row, "col": col}], False, "p1", ability=ability)
    assert result["valid"] == (ability in allowed)


def test_connector_can_touch_multiple_own_pieces():
    board = Board(get_board_config("square", 2))
    board.place_piece([{"row": 3, "col": 3}], player="p1", piece_id="one")
    board.place_piece([{"row": 3, "col": 5}], player="p1", piece_id="two")
    result = validate_move(board.grid, [{"row": 3, "col": 4}], False, "p1", ability="connector")
    assert result["valid"]


@pytest.mark.parametrize("layout,player_count", sorted(BOARD_CONFIGS))
@pytest.mark.parametrize("ability", ["scout", "connector"])
def test_special_first_moves_and_reservations_on_every_layout(layout, player_count, ability):
    with TestClient(main.app) as client:
        game, credentials = create_game(client, layout, player_count, bots=True)
        player = game["players"][0]
        target = next(piece for piece in player["pieces"] if piece["name"] == "I1")
        target["ability"] = ability
        def validate(cells):
            return main.validate_player_move(game, player, main.MoveRequest(
                pieceName="I1", cells=cells, **credentials[0],
            ))

        assert validate([player["startPosition"]])["valid"]
        another_start = game["players"][1]["startPosition"]
        assert "reserved" in validate([another_start])["reason"]
        wrong = next(
            {"row": y, "col": x} for x, y in game["boardConfig"]["cells"]
            if {"row": y, "col": x} not in [p["startPosition"] for p in game["players"]]
        )
        assert "assigned starting" in validate([wrong])["reason"]
        assert "out of bounds" in validate([{"row": game["board"].height, "col": 0}])["reason"]
        if layout != "square":
            hole = next(
                {"row": row, "col": col}
                for row, cells in enumerate(game["board"].grid)
                for col, cell in enumerate(cells) if not cell["playable"]
            )
            assert "non-playable" in validate([hole])["reason"]


def test_api_privacy_credentials_and_persistence():
    with TestClient(main.app) as client:
        game, credentials = create_game(client)
        endpoint = f'/games/{game["gameId"]}'
        before = [assignments(player["pieces"]) for player in game["players"]]
        assert_private_snapshot(client.get(endpoint).json())
        for own in credentials:
            for _ in range(2):
                response = client.get(endpoint, headers=own_headers(own))
                assert response.status_code == 200
                assert_private_snapshot(response.json(), own["playerId"])
        assert client.get(endpoint, headers={"X-Player-Id": credentials[0]["playerId"]}).status_code == 403
        assert client.get(endpoint, headers={
            "X-Player-Id": credentials[1]["playerId"],
            "X-Player-Token": credentials[0]["playerToken"],
        }).status_code == 403
        assert before == [assignments(player["pieces"]) for player in game["players"]]


def test_websocket_snapshots_are_private_on_broadcast_request_and_reconnect():
    with TestClient(main.app) as client:
        game, credentials = create_game(client)
        first, second = credentials
        def socket_url(own):
            return f'/games/{game["gameId"]}/ws?playerId={own["playerId"]}&token={own["playerToken"]}'
        before = assignments(game["players"][0]["pieces"])
        with client.websocket_connect(socket_url(first)) as first_socket:
            assert_private_snapshot(first_socket.receive_json()["game"], first["playerId"])
            with client.websocket_connect(socket_url(second)) as second_socket:
                assert_private_snapshot(first_socket.receive_json()["game"], first["playerId"])
                assert_private_snapshot(second_socket.receive_json()["game"], second["playerId"])
                for socket, own in [(first_socket, first), (second_socket, second)]:
                    socket.send_json({"type": "request_state"})
                    assert_private_snapshot(socket.receive_json()["game"], own["playerId"])
                piece = next(p for p in game["players"][0]["pieces"] if p.get("ability"))
                cells = next(main.valid_placements_for_piece(game, game["players"][0], piece))
                first_socket.send_json({"type": "place_piece", "pieceName": piece["name"], "cells": cells})
                for socket, own in [(first_socket, first), (second_socket, second)]:
                    snapshot = socket.receive_json()["game"]
                    assert_private_snapshot(snapshot, own["playerId"])
                    placed = next(p for p in snapshot["players"][0]["pieces"] if p["name"] == piece["name"])
                    assert placed["placed"] and "ability" not in placed
                    assert all("ability" not in snapshot["board"][cell["row"]][cell["col"]] for cell in cells)
        with client.websocket_connect(socket_url(first)) as reconnected:
            assert_private_snapshot(reconnected.receive_json()["game"], first["playerId"])
        assert assignments(game["players"][0]["pieces"]) == before


@pytest.mark.parametrize("ability", ["scout", "connector"])
@pytest.mark.parametrize("is_bot", [False, True])
def test_automatic_moves_use_abilities_and_normal_placement_consumes_piece(ability, is_bot):
    with TestClient(main.app) as client:
        game, _ = create_game(client, bots=True)
        player = game["players"][1 if is_bot else 0]
        game["currentTurnIndex"] = 1 if is_bot else 0
        for piece in player["pieces"]:
            piece["placed"] = piece["name"] != "I1"
        special = next(p for p in player["pieces"] if p["name"] == "I1")
        special["ability"] = ability
        # Scout has only an isolated destination; Connector has only an edge destination.
        start = player["startPosition"]
        own = dict(start)
        destination = {"row": start["row"], "col": start["col"] + 1} if ability == "connector" else {"row": 0, "col": 0}
        for row in game["board"].grid:
            for cell in row:
                cell.update(occupied=True, player="blocked")
        game["board"].grid[own["row"]][own["col"]]["player"] = player["id"]
        game["board"].grid[destination["row"]][destination["col"]].update(occupied=False, player=None)
        assert main.can_player_move(game, player)
        move = main.choose_automatic_move(game, player)
        assert move == {"pieceName": "I1", "cells": [destination]}
        assert main.validate_player_move(game, player, main.MoveRequest(
            **move, playerId=player["id"], playerToken=player["token"] or "",
        ))["valid"]
        main.apply_move(game, player, move["pieceName"], move["cells"])
        assert special["placed"]
        assert main.choose_automatic_move(game, player) is None


def test_restart_assignments_are_private_and_new_match_has_one_of_each():
    with TestClient(main.app) as client:
        game, credentials = create_game(client)
        main.finish_game(game)
        response = client.post(f'/games/{game["gameId"]}/restart', json=credentials[0])
        assert response.status_code == 200
        assert_private_snapshot(response.json(), credentials[0]["playerId"])
        for player in game["players"]:
            assert sorted(assignments(player["pieces"]).values()) == ["connector", "scout"]
            assert all(not piece["placed"] for piece in player["pieces"])


def test_client_cannot_override_a_normal_pieces_ability():
    with TestClient(main.app) as client:
        game, credentials = create_game(client)
        player = game["players"][0]
        piece = next(p for p in player["pieces"] if not p.get("ability"))
        first_piece = next(p for p in player["pieces"] if p is not piece)
        first_piece["placed"] = True
        game["board"].place_piece([player["startPosition"]], player=player["id"])
        orientation = main.piece_orientations(piece)[0]
        response = client.post(f'/games/{game["gameId"]}/validate-move', json={
            **credentials[0],
            "pieceName": piece["name"],
            "cells": [{"row": row, "col": col} for row, col in orientation],
            "ability": "scout",
        })
        assert response.status_code == 200
        assert not response.json()["valid"]
        assert "ability" not in piece


def test_quitting_preserves_assignments_for_bot_and_revokes_private_access():
    with TestClient(main.app) as client:
        game, credentials = create_game(client)
        before = assignments(game["players"][0]["pieces"])
        response = client.post(f'/games/{game["gameId"]}/quit', json=credentials[0])
        assert response.status_code == 200
        assert game["players"][0]["isBot"]
        assert assignments(game["players"][0]["pieces"]) == before
        assert client.get(f'/games/{game["gameId"]}', headers=own_headers(credentials[0])).status_code == 403
        assert_private_snapshot(client.get(f'/games/{game["gameId"]}').json())
