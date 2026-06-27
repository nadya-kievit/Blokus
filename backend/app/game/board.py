class Board:

    def __init__(self, size=20):

        self.size = size

        self.grid = [
            [
                {
                    "occupied": False,
                    "player": None
                }
                for _ in range(size)
            ]
            for _ in range(size)
        ]

    def place_piece(self, cells, player=1, color=None):

        for cell in cells:

            row = cell["row"]
            col = cell["col"]

            self.grid[row][col]["occupied"] = True
            self.grid[row][col]["player"] = player
            self.grid[row][col]["color"] = color

    def get_grid(self):
        return self.grid
