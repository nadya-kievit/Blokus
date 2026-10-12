class Board:

    def __init__(self, config):

        self.width = config["width"]
        self.height = config["height"]
        playable_cells = set(config["cells"])

        self.grid = [
            [
                {
                    "playable": (col, row) in playable_cells,
                    "occupied": False,
                    "player": None,
                    "pieceId": None,
                }
                for col in range(self.width)
            ]
            for row in range(self.height)
        ]

    def place_piece(self, cells, player=1, color=None, piece_id=None):

        for cell in cells:
            row = cell["row"]
            col = cell["col"]
            if (
                row < 0
                or row >= self.height
                or col < 0
                or col >= self.width
                or not self.grid[row][col]["playable"]
            ):
                raise ValueError("Piece cannot occupy a non-playable square.")

        for cell in cells:

            row = cell["row"]
            col = cell["col"]

            self.grid[row][col]["occupied"] = True
            self.grid[row][col]["player"] = player
            self.grid[row][col]["color"] = color
            self.grid[row][col]["pieceId"] = piece_id

    def get_grid(self):
        return self.grid
