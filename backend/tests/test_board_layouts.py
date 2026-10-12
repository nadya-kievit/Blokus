import json

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.game.board_layouts import BOARD_CONFIGS, LAYOUTS_PATH, get_board_config
from app.main import MoveRequest, app, choose_random_bot_move, games, validate_player_move


client = TestClient(app)


def setup_function():
    for task in main_module.turn_tasks.values():
        task.cancel()
    main_module.turn_tasks.clear()
    games.clear()
    main_module.choose_starting_player_index = lambda _player_count: 0
    main_module.choose_start_positions = (
        lambda start_positions, player_count: list(start_positions)[:player_count]
    )


def player_settings(player_count, human_slots=(1,)):
    return {
        f"Player {index}": {"isBot": index not in human_slots}
        for index in range(1, player_count + 1)
    }


def create_started_game(layout, player_count, human_slots=(1,)):
    created = client.post(
        "/games",
        json={
            "settings": {
                "boardLayout": layout,
                "playerCount": player_count,
                "players": player_settings(player_count, human_slots),
            }
        },
    ).json()
    joined = client.post(
        f'/games/{created["gameId"]}/join',
        json={"color": "Blue"},
    ).json()
    return games[created["gameId"]], joined


def test_layout_file_contains_exactly_the_15_supported_configurations():
    source = json.loads(LAYOUTS_PATH.read_text(encoding="utf-8"))
    expected_keys = {
        (layout, players)
        for layout in ("square", "irregular", "rooms")
        for players in range(2, 7)
    }

    assert len(source["boards"]) == 15
    assert set(BOARD_CONFIGS) == expected_keys

    for source_board in source["boards"]:
        config = get_board_config(source_board["layout"], source_board["players"])
        assert config["id"] == source_board["id"]
        assert config["width"] == source_board["width"]
        assert config["height"] == source_board["height"]
        assert config["cells"] == [tuple(cell) for cell in source_board["cells"]]
        assert config["startPositions"] == [
            tuple(position) for position in source_board["startPositions"]
        ]


@pytest.mark.parametrize(
    ("layout", "player_count"),
    [
        (layout, player_count)
        for layout in ("square", "irregular", "rooms")
        for player_count in range(2, 7)
    ],
)
def test_game_creation_loads_the_matching_board(layout, player_count):
    response = client.post(
        "/games",
        json={
            "settings": {
                "boardLayout": layout,
                "playerCount": player_count,
                "players": player_settings(player_count),
            }
        },
    )
    game = response.json()
    config = get_board_config(layout, player_count)

    assert response.status_code == 200
    assert game["boardConfig"]["id"] == f"{layout}-{player_count}"
    assert len(game["board"]) == config["height"]
    assert all(len(row) == config["width"] for row in game["board"])

    playable_coordinates = {
        (col, row)
        for row, board_row in enumerate(game["board"])
        for col, cell in enumerate(board_row)
        if cell["playable"]
    }
    assert playable_coordinates == set(config["cells"])


def test_start_positions_are_distinct_playable_and_persisted():
    game, _ = create_started_game("rooms", 6)
    first_snapshot = client.get(f'/games/{game["gameId"]}').json()
    second_snapshot = client.get(f'/games/{game["gameId"]}').json()
    assigned = [player["startPosition"] for player in first_snapshot["players"]]

    assert len({(position["row"], position["col"]) for position in assigned}) == 6
    assert assigned == [player["startPosition"] for player in second_snapshot["players"]]
    assert all(
        first_snapshot["board"][position["row"]][position["col"]]["playable"]
        for position in assigned
    )


def test_non_playable_cells_are_rejected_by_validation_and_board_storage():
    game, joined = create_started_game("irregular", 2)
    player = game["players"][0]
    non_playable = next(
        {"row": row, "col": col}
        for row, board_row in enumerate(game["board"].grid)
        for col, cell in enumerate(board_row)
        if not cell["playable"]
    )
    move = MoveRequest(
        playerId=joined["playerId"],
        playerToken=joined["playerToken"],
        pieceName="I1",
        cells=[non_playable],
    )

    result = validate_player_move(game, player, move)

    assert result == {
        "valid": False,
        "reason": "Piece overlaps a non-playable square.",
    }
    with pytest.raises(ValueError, match="non-playable"):
        game["board"].place_piece([non_playable], player=player["id"])


def test_first_move_requires_assigned_square_and_other_starts_remain_reserved():
    game, joined = create_started_game("square", 2)
    player = game["players"][0]
    other_player = game["players"][1]
    wrong_playable_cell = {"row": 0, "col": 0}

    first_move = MoveRequest(
        playerId=joined["playerId"],
        playerToken=joined["playerToken"],
        pieceName="I1",
        cells=[wrong_playable_cell],
    )
    assert validate_player_move(game, player, first_move)["reason"] == (
        "First piece must cover your assigned starting square."
    )

    player["pieces"][0]["placed"] = True
    reserved_move = MoveRequest(
        playerId=joined["playerId"],
        playerToken=joined["playerToken"],
        pieceName="I1",
        cells=[dict(other_player["startPosition"])],
    )
    assert validate_player_move(game, player, reserved_move)["reason"] == (
        "Piece overlaps another player's reserved starting square."
    )


def test_bot_first_move_uses_its_assigned_start_and_avoids_other_reserved_starts():
    game, _ = create_started_game("rooms", 2)
    bot = next(player for player in game["players"] if player["isBot"])
    other_starts = {
        (player["startPosition"]["row"], player["startPosition"]["col"])
        for player in game["players"]
        if player["id"] != bot["id"]
    }

    move = choose_random_bot_move(game, bot)
    move_positions = {(cell["row"], cell["col"]) for cell in move["cells"]}
    bot_start = (bot["startPosition"]["row"], bot["startPosition"]["col"])

    assert bot_start in move_positions
    assert move_positions.isdisjoint(other_starts)
