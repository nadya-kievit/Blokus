class Piece:

    def __init__(self, name, cells, placed=False):
        self.name = name
        self.cells = cells
        self.placed = placed

    def get_cells(self):
        return self.cells
    
    def set_placed(self, placed):
        self.placed = placed

    def is_placed(self):
        return self.placed