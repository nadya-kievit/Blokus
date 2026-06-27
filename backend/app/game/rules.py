BOARD_SIZE = 20


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


def validate_move(board_grid, cells, is_first_move, player_id=1, first_corner=None):

    if not cells:
        return {
            "valid": False,
            "reason": "No cells were provided."
        }

    move_positions = set()

    for cell in cells:
        row, col = get_cell_position(cell)

        # Rule 1: cannot place out of bounds
        if row < 0 or row >= BOARD_SIZE or col < 0 or col >= BOARD_SIZE:
            return {
                "valid": False,
                "reason": "Piece is out of bounds."
            }

        # Rule 2: cannot place on top of another tile
        if is_cell_occupied(board_grid[row][col]):
            return {
                "valid": False,
                "reason": "Piece overlaps an occupied tile."
            }

        move_positions.add((row, col))

    # Rule 3: first move must touch the player's assigned corner
    if is_first_move:
        required_corner = first_corner or (BOARD_SIZE - 1, BOARD_SIZE - 1)

        if tuple(required_corner) not in move_positions:
            return {
                "valid": False,
                "reason": "First piece must cover your starting corner."
            }

        return {
            "valid": True,
            "reason": "Valid first move."
        }

    touches_diagonal = False

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
                0 <= neighbor_row < BOARD_SIZE and
                0 <= neighbor_col < BOARD_SIZE and
                cell_belongs_to_player(board_grid[neighbor_row][neighbor_col], player_id)
            ):
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
                0 <= neighbor_row < BOARD_SIZE and
                0 <= neighbor_col < BOARD_SIZE and
                cell_belongs_to_player(board_grid[neighbor_row][neighbor_col], player_id)
            ):
                touches_diagonal = True

    if not touches_diagonal:
        return {
            "valid": False,
            "reason": "Piece must touch one of your pieces diagonally."
        }

    return {
        "valid": True,
        "reason": "Valid move."
    }
