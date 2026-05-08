from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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


@app.get("/game/state")
def get_game_state():

    return {
        "board": board.get_grid()
    }


@app.post("/game/test-move")
def test_move(move: MoveRequest):

    board.place_piece(move.cells)

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

@app.post("/game/reset")
def reset_board():

    global board

    board = Board()

    return {
        "success": True
    }