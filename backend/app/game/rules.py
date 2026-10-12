def get_cell_position(cell):

    if isinstance(cell, dict):
        return cell["row"], cell["col"]

    return cell[0], cell[1]


def is_cell_occupied(board_cell):

    if isinstance(board_cell, dict):
        return board_cell.get("occupied", False)

    return board_cell != 0


def cell_belongs_to_player(board_cell, player_id):

    if isinstance(board_cell, dict):
        return board_cell.get("player") == player_id

    return False


def is_position_in_bounds(board_grid, row, col):
    return (
        0 <= row < len(board_grid)
        and 0 <= col < len(board_grid[row])
    )


def validate_move(
    board_grid,
    cells,
    is_first_move,
    player_id=1,
    first_corner=None,
    reserved_positions=None,
    ability=None,
):

    if not cells:
        return {
            "valid": False,
            "reason": "No cells were provided."
        }

    move_positions = set()

    for cell in cells:
        row, col = get_cell_position(cell)

        # Rule 1: cannot place out of bounds
        if not is_position_in_bounds(board_grid, row, col):
            return {
                "valid": False,
                "reason": "Piece is out of bounds."
            }

        if not board_grid[row][col].get("playable", True):
            return {
                "valid": False,
                "reason": "Piece overlaps a non-playable square."
            }

        # Rule 2: cannot place on top of another tile
        if is_cell_occupied(board_grid[row][col]):
            return {
                "valid": False,
                "reason": "Piece overlaps an occupied tile."
            }

        move_positions.add((row, col))

    reserved_positions = set(reserved_positions or [])
    if move_positions & reserved_positions:
        return {
            "valid": False,
            "reason": "Piece overlaps another player's reserved starting square."
        }

    # Rule 3: first move must cover the player's assigned starting square
    if is_first_move:
        required_corner = first_corner

        if required_corner is None or tuple(required_corner) not in move_positions:
            return {
                "valid": False,
                "reason": "First piece must cover your assigned starting square."
            }

        return {
            "valid": True,
            "reason": "Valid first move."
        }

    touches_diagonal = False
    touches_side = False

    for row, col in move_positions:

        # Rule 4: cannot touch another placed tile horizontally/vertically
        side_neighbors = [
            (row - 1, col),
            (row + 1, col),
            (row, col - 1),
            (row, col + 1),
        ]

        for neighbor_row, neighbor_col in side_neighbors:
            if (
                is_position_in_bounds(board_grid, neighbor_row, neighbor_col) and
                cell_belongs_to_player(board_grid[neighbor_row][neighbor_col], player_id)
            ):
                touches_side = True
                if ability != "connector":
                    return {
                        "valid": False,
                        "reason": "Piece cannot touch your own pieces horizontally or vertically."
                    }

        # Rule 5: must touch another placed tile diagonally
        diagonal_neighbors = [
            (row - 1, col - 1),
            (row - 1, col + 1),
            (row + 1, col - 1),
            (row + 1, col + 1),
        ]

        for neighbor_row, neighbor_col in diagonal_neighbors:
            if (
                is_position_in_bounds(board_grid, neighbor_row, neighbor_col) and
                cell_belongs_to_player(board_grid[neighbor_row][neighbor_col], player_id)
            ):
                touches_diagonal = True

    if ability == "connector" and not (touches_side or touches_diagonal):
        return {
            "valid": False,
            "reason": "Connector must touch one of your pieces along an edge or corner."
        }

    if ability not in {"scout", "connector"} and not touches_diagonal:
        return {
            "valid": False,
            "reason": "Piece must touch one of your pieces diagonally."
        }

    return {
        "valid": True,
        "reason": "Valid move."
    }
