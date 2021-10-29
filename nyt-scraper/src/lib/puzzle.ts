import { Puzzle } from "../models/Puzzle";
import { PuzzleEntry } from "../models/PuzzleEntry";
import { Sources } from "../models/PuzzleSource";
import { Square } from "../models/Square";

export function newPuzzle(width: number, height: number): Puzzle {
    return {
        title: "",
        authors: [],
        copyright: "",
        date: new Date(),
        source: Sources.None,
    
        grid: newGrid(width, height),
        entries: new Map<string, PuzzleEntry>(),
    } as Puzzle;
}

export function newGrid(width: number, height: number): Square[][] {
    let ret = [] as Square[][];
    for (let row = 0; row < height; row++) {
        ret.push([])
        for (let col = 0; col < width; col++) {
            ret[row].push(newSquare(row, col))
        }
    }
    return ret
}

function newSquare(row: number, col: number): Square {
    return {
        row: row,
        col: col,
        isBlack: false,
        content: "",
        isCircled: false,
    } as Square;
}