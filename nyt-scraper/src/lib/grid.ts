import { Square } from "../models/Square";

export function numberizeGrid(grid: Square[][]) {
    let currentNumber = 1;

    let height = grid.length;
    let width = grid[0].length;
    for(var row = 0; row < height; row++) {
        for (var col = 0; col < width; col++) {
            var sq = grid[row][col];  
            sq.number = undefined;
            sq.directions = [];

            if (sq.isBlack) continue;

            let isAboveBlocked = (row === 0 || grid[row-1][col].isBlack);
            let isBelowBlocked = (row === height-1 || grid[row+1][col].isBlack);
            let isLeftBlocked = (col === 0 || grid[row][col-1].isBlack);
            let isRightBlocked = (col === width-1 || grid[row][col+1].isBlack);

            let isAcrossStart = isLeftBlocked && !isRightBlocked;
            let isDownStart = isAboveBlocked && !isBelowBlocked;
            let isIsolatedSquare = isLeftBlocked && isRightBlocked && isAboveBlocked && isBelowBlocked;

            if (isAcrossStart || isDownStart || isIsolatedSquare) sq.number = currentNumber++;
            if (isAcrossStart || isIsolatedSquare) sq.directions.push("A");
            if (isDownStart) sq.directions.push("D");
        }
    }
}
