import json
from copy import deepcopy
from pathlib import Path


LAYOUTS_PATH = Path(__file__).with_name("board_layouts_15.json")


def _load_board_configs():
    with LAYOUTS_PATH.open(encoding="utf-8") as layouts_file:
        data = json.load(layouts_file)

    configs = {}
    for board in data["boards"]:
        key = (board["layout"], board["players"])
        cells = [tuple(cell) for cell in board["cells"]]
        start_positions = [tuple(position) for position in board["startPositions"]]

        if board["id"] != f'{board["layout"]}-{board["players"]}':
            raise ValueError(f'Unexpected board id: {board["id"]}')
        if key in configs:
            raise ValueError(f'Duplicate board configuration: {board["id"]}')
        if len(cells) != len(set(cells)):
            raise ValueError(f'Duplicate playable cells in {board["id"]}')
        if len(start_positions) != board["players"]:
            raise ValueError(f'Incorrect starting-position count in {board["id"]}')

        for x, y in cells:
            if not (0 <= x < board["width"] and 0 <= y < board["height"]):
                raise ValueError(f'Out-of-bounds playable cell in {board["id"]}')
        for position in start_positions:
            if position not in cells:
                raise ValueError(f'Non-playable starting position in {board["id"]}')

        configs[key] = {
            "id": board["id"],
            "layout": board["layout"],
            "players": board["players"],
            "width": board["width"],
            "height": board["height"],
            "cells": cells,
            "startPositions": start_positions,
        }

    expected_keys = {
        (layout, players)
        for layout in ("square", "irregular", "rooms")
        for players in range(2, 7)
    }
    if set(configs) != expected_keys:
        raise ValueError("Board layout data must contain all 15 layout/player configurations.")

    return configs


BOARD_CONFIGS = _load_board_configs()
SUPPORTED_LAYOUTS = frozenset(layout for layout, _ in BOARD_CONFIGS)
SUPPORTED_PLAYER_COUNTS = frozenset(players for _, players in BOARD_CONFIGS)


def get_board_config(layout, player_count):
    try:
        return deepcopy(BOARD_CONFIGS[(layout, player_count)])
    except KeyError as error:
        raise ValueError(
            f"Unsupported board configuration: {layout}-{player_count}"
        ) from error
