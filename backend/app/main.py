from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.game.rules import validate_move
from app.game.pieces import ALL_PIECES
from app.game.board import Board

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory board
board = Board()


class MoveRequest(BaseModel):
    cells: list
    pieceName: str


@app.get("/game/state")
def get_game_state():

    return {
        "board": board.get_grid()
    }


@app.post("/game/test-move")
def test_move(move: MoveRequest):

    is_first_move = not any(piece.placed for piece in ALL_PIECES)

    result = validate_move(
        board_grid=board.get_grid(),
        cells=move.cells,
        is_first_move=is_first_move
    )

    if not result["valid"]:
        return {
            "success": False,
            "reason": result["reason"]
        }

    board.place_piece(move.cells)

    for piece in ALL_PIECES:
        if piece.name == move.pieceName:
            piece.set_placed(True)

    return {
        "success": True,
        "reason": result["reason"]
    }


@app.post("/game/validate-move")
def validate_move_endpoint(move: MoveRequest):

    is_first_move = not any(piece.placed for piece in ALL_PIECES)

    result = validate_move(
        board_grid=board.get_grid(),
        cells=move.cells,
        is_first_move=is_first_move
    )

    return result


@app.get("/game/pieces")
def get_pieces():

    return {
        "pieces": [
            {
                "name": piece.name,
                "cells": piece.cells,
                "placed": piece.placed
            }
            for piece in ALL_PIECES
        ]
    }


@app.post("/game/reset")
def reset_board():

    global board

    board = Board()

    for piece in ALL_PIECES:
        piece.set_placed(False)

    return {
        "success": True
    }