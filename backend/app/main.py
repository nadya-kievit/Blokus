from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.game.pieces import ALL_PIECES

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory board
board = [[0 for _ in range(20)] for _ in range(20)]


class MoveRequest(BaseModel):
    row: int
    col: int


@app.get("/game/state")
def get_game_state():
    return {
        "board": board
    }


@app.post("/game/test-move")
def test_move(move: MoveRequest):

    print(f"Move received: {move.row}, {move.col}")

    board[move.row][move.col] = 1

    return {
        "success": True
    }

@app.get("/game/pieces")
def get_pieces():

    return {
        "pieces": [
            {
                "name": piece.name,
                "cells": piece.cells
            }
            for piece in ALL_PIECES
        ]
    }