import { Puzzle } from "../models/Puzzle";
import { PuzzleEntry } from "../models/PuzzleEntry";
import { numberizeGrid } from "./grid";
import { newPuzzle } from "./puzzle";
import { deepClone, mapKeys } from "./utils";

// https://code.google.com/archive/p/puz/wikis/FileFormat.wiki

export async function loadPuzFile(url: string): Promise<Puzzle | undefined> {
    let response = await fetch(url);
    let data: Blob = await response.blob();

    return processPuzData(data);
}

export async function processPuzData(data: Blob): Promise<Puzzle | undefined> {
    let magicString = await data.slice(0x02, 0x0e).text();
    if (magicString !== "ACROSS&DOWN\0") return undefined;

    let width = new Uint8Array(await data.slice(0x2c, 0x2d).arrayBuffer())[0];
    let height = new Uint8Array(await data.slice(0x2d, 0x2e).arrayBuffer())[0];

    let puzzle = newPuzzle(width, height);
    let restOfFile = await blobToText(await data.slice(0x34, data.size));

    let i = 0;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let curChar = restOfFile[i];
            let square = puzzle.grid[row][col];
            if (curChar === ".")
                square.isBlack = true;
            if (curChar === "-") {} // no data entered
            if (curChar.match(/[A-Z]/)) {
                square.content = curChar;
            }
            i++;
        }
    }
    i *= 2; // skip over user progress

    numberizeGrid(puzzle.grid);
    
    let author = "";
    [puzzle.title, i] = getNextString(restOfFile, i);
    [author, i] = getNextString(restOfFile, i);
    [puzzle.copyright, i] = getNextString(restOfFile, i);
    puzzle.authors = [author];

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let square = puzzle.grid[row][col];
            let number = square.number;
            if (!number) continue;

            if (square.directions.includes("A")) {
                let clue = "";
                [clue, i] = getNextString(restOfFile, i);
                let key = number.toString() + "A";

                let entry = "";
                let curCol = col;
                let curSq = square;
                while (true) {
                    entry += curSq.content;
                    curCol++;
                    if (curCol >= width) break;
                    curSq = puzzle.grid[row][curCol];
                    if (curSq.isBlack) break;
                }

                let puzEntry = {
                    index: key,
                    entry: entry,
                    clue: clue,
                } as PuzzleEntry;
                puzzle.entries.set(key, puzEntry);
            }

            if (square.directions.includes("D")) {
                let clue = "";
                [clue, i] = getNextString(restOfFile, i);
                let key = number.toString() + "D";

                let entry = "";
                let curRow = row;
                let curSq = square;
                while (true) {
                    entry += curSq.content;
                    curRow++;
                    if (curRow >= height) break;
                    curSq = puzzle.grid[curRow][col];
                    if (curSq.isBlack) break;
                }

                let puzEntry = {
                    index: key,
                    entry: entry,
                    clue: clue,
                } as PuzzleEntry;
                puzzle.entries.set(key, puzEntry);
            }
        }
    }

    [puzzle.notes, i] = getNextString(restOfFile, i);

    let rebusSquareMappings = new Map<string, number>();
    let rebusValues = new Map<number, string>();

    while (i < restOfFile.length) {
        let sectionType = restOfFile.slice(i, i+4);
        i += 4;
        let dlI = 0x34 + i;
        let dataLength = new Uint16Array(await data.slice(dlI, dlI+2).arrayBuffer())[0];
        i += 2;
        i += 2; // skip checksum

        if (sectionType === "GRBS") { // rebus grid
            let secI = 0x34 + i;
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    let n = new Uint8Array(await data.slice(secI, secI + 1).arrayBuffer())[0];
                    secI++;
                    if (n > 0) {
                        rebusSquareMappings.set(`${row},${col}`, n-1);
                    }
                }
            }
        }
        if (sectionType === "RTBL") { // rebus values
            let valuesStr = restOfFile.slice(i, i + dataLength);
            let valueStrs = valuesStr.split(";");
            valueStrs.forEach(str => {
                let tokens = str.split(":");
                let n = +tokens[0].trim();
                let val = tokens[1];
                if (n > 0) rebusValues.set(n, val);
            });
        }
        if (sectionType === "GEXT") { // extra flags
            let secI = 0x34 + i;
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    let n = new Uint8Array(await data.slice(secI, secI + 1).arrayBuffer())[0];
                    secI++;
                    if (n & 0x80) {
                        puzzle.grid[row][col].isCircled = true;
                    }
                }
            }
        }

        i += dataLength + 1;
    }

    if (rebusSquareMappings.size > 0) {
        rebusSquareMappings.forEach((v, k) => {
            let tokens = k.split(",");
            let square = puzzle.grid[+tokens[0]][+tokens[1]];
            square.content = rebusValues.get(v)!;
        });
    }

    return puzzle;
}

async function blobToText(blob: Blob): Promise<string> {
    let arr = Array.from(new Uint8Array(await blob.arrayBuffer()));
    return arr.map(x => String.fromCharCode(x)).join("");
}

function getNextString(data: string, i: number): [string, number] {
    let ret = "";
    while(data[i] !== "\0") {
        ret += data[i];
        i++;
    }
    i++;
    return [ret.trim(), i];
}

export function generatePuzFile(puzzle: Puzzle): Blob {
    let grid = puzzle.grid;
    let bytes = new Uint8Array(128_000);
    let width = grid[0].length;
    let height = grid.length;
    insertString(bytes, "ACROSS&DOWN\0", 0x02);
    insertString(bytes, "1.3\0", 0x18);

    insertNumber(bytes, width, 0x2c, 1);
    insertNumber(bytes, height, 0x2d, 1);
    insertNumber(bytes, puzzle.entries.size, 0x2e, 2);
    insertNumber(bytes, 1, 0x30, 2);
    insertNumber(bytes, 0, 0x32, 2);

    let pos = 0x34;
    let solutionPos = pos;
    let areCircledSquares = false;
    let areRebusSquares = false;
    let rebusNumbering = new Map<string, number>();
    let curRebusNumber = 1;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let sq = grid[row][col];
            let char = sq.isBlack ? "." : sq.content ? sq.content[0] : " ";
            insertString(bytes, char, pos);
            pos++;

            if (sq.isCircled) areCircledSquares = true;
            if (sq.content.length > 1) {
                areRebusSquares = true;
                if (!rebusNumbering.has(sq.content)) {
                    rebusNumbering.set(sq.content, curRebusNumber++);
                }
            }
        }
    }
    let gridPos = pos;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let sq = grid[row][col];
            let char = sq.isBlack ? "." : "-";
            insertString(bytes, char, pos);
            pos++;
        }
    }

    let titlePos = pos;
    insertString(bytes, puzzle.title + "\0", pos);
    pos += puzzle.title.length + 1;
    let authorPos = pos;
    let authorStr = puzzle.authors.join(", ");
    insertString(bytes, authorStr + "\0", pos);
    pos += authorStr.length + 1;
    let copyrightPos = pos;
    insertString(bytes, puzzle.copyright + "\0", pos);
    pos += puzzle.copyright.length + 1;

    let sortedKeys = sortEntryKeysForPuz(mapKeys(puzzle.entries));
    let cluesPos = pos;
    sortedKeys.forEach(key => {
        let puzEntry = puzzle.entries.get(key)!;
        insertString(bytes, puzEntry.clue + "\0", pos);
        pos += puzEntry.clue.length + 1;
    });

    let notes = puzzle.notes || "";
    insertString(bytes, notes + "\0", pos);
    pos += notes.length + 1;

    if (areRebusSquares) {
        let sectionSize1 = width * height;
        insertString(bytes, "GRBS", pos);
        pos += 4;
        insertNumber(bytes, sectionSize1, pos, 2);
        pos += 2;
        let checksumPos1 = pos;
        pos += 2;
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                let sq = grid[row][col];
                insertNumber(bytes, 1 + rebusNumbering.get(sq.content)!, pos, 1);
                pos++;
            }
        }
        insertString(bytes, "\0", pos);
        pos++;

        let cksum1 = cksum_region(bytes, checksumPos1 + 2, sectionSize1, 0);
        insertNumber(bytes, cksum1, checksumPos1, 2);

        let sectionSize2 = 0;
        insertString(bytes, "RTBL", pos);
        pos += 4;
        let sectionSize2Pos = pos;
        pos += 2;
        let checksumPos2 = pos;
        pos += 2;
        for (let key of mapKeys(rebusNumbering)) {
            let num = rebusNumbering.get(key)!;
            let str = `${num < 10 ? " " : ""}${num.toString()}:${key};`;
            insertString(bytes, str, pos);
            sectionSize2 += str.length;
            pos += str.length;
        }
        insertString(bytes, "\0", pos);
        pos++;

        let cksum2 = cksum_region(bytes, checksumPos2 + 2, sectionSize2, 0);
        insertNumber(bytes, cksum2, checksumPos2, 2);
        insertNumber(bytes, sectionSize2, sectionSize2Pos, 2);
    }

    if (areCircledSquares) {
        let sectionSize = width * height;
        insertString(bytes, "GEXT", pos);
        pos += 4;
        insertNumber(bytes, sectionSize, pos, 2);
        pos += 2;
        let checksumPos = pos;
        pos += 2;
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                let sq = grid[row][col];
                insertNumber(bytes, sq.isCircled ? 0x80 : 0, pos, 1);
                pos++;
            }
        }
        insertString(bytes, "\0", pos);
        pos++;

        let cksum = cksum_region(bytes, checksumPos + 2, sectionSize, 0);
        insertNumber(bytes, cksum, checksumPos, 2);
    }

    let c_cib = cksum_region(bytes, 0x2c, 8, 0);
    let cksum = c_cib;
    let squaresTotal = width * height;
    cksum = cksum_region(bytes, solutionPos, squaresTotal, cksum);
    cksum = cksum_region(bytes, gridPos, squaresTotal, cksum);
    if (puzzle.title.length > 0) cksum = cksum_region(bytes, titlePos, puzzle.title.length+1, cksum);
    if (authorStr.length > 0) cksum = cksum_region(bytes, authorPos, authorStr.length+1, cksum);
    if (puzzle.copyright.length > 0) cksum = cksum_region(bytes, copyrightPos, puzzle.copyright.length+1, cksum);
    let cluePos = cluesPos;
    for(let i = 0; i < sortedKeys.length; i++) {
        let puzEntry = puzzle.entries.get(sortedKeys[i])!;
        cksum = cksum_region(bytes, cluePos, puzEntry.clue.length, cksum);
        cluePos += puzEntry.clue.length + 1;
    }
    insertNumber(bytes, c_cib, 0x0e, 2);
    insertNumber(bytes, cksum, 0x00, 2);

    let c_sol = cksum_region(bytes, solutionPos, squaresTotal, 0);
    let c_grid = cksum_region(bytes, gridPos, squaresTotal, 0);
    let c_part = 0;
    if (puzzle.title.length > 0) c_part = cksum_region(bytes, titlePos, puzzle.title.length+1, c_part);
    if (authorStr.length > 0) c_part= cksum_region(bytes, authorPos, authorStr.length+1, c_part);
    if (puzzle.copyright.length > 0) c_part = cksum_region(bytes, copyrightPos, puzzle.copyright.length+1, c_part);
    cluePos = cluesPos;
    for(let i = 0; i < sortedKeys.length; i++) {
        let puzEntry = puzzle.entries.get(sortedKeys[i])!;
        c_part = cksum_region(bytes, cluePos, puzEntry.clue.length, c_part);
        cluePos += puzEntry.clue.length + 1;
    }
    insertNumber(bytes, 0x49 ^ (c_cib & 0xFF), 0x10, 1);
    insertNumber(bytes, 0x43 ^ (c_sol & 0xFF), 0x11, 1);
    insertNumber(bytes, 0x48 ^ (c_grid & 0xFF), 0x12, 1);
    insertNumber(bytes, 0x45 ^ (c_part & 0xFF), 0x13, 1);
    insertNumber(bytes, 0x41 ^ ((c_cib & 0xFF00) >> 8), 0x14, 1);
    insertNumber(bytes, 0x54 ^ ((c_sol & 0xFF00) >> 8), 0x15, 1);
    insertNumber(bytes, 0x45 ^ ((c_grid & 0xFF00) >> 8), 0x16, 1);
    insertNumber(bytes, 0x44 ^ ((c_part & 0xFF00) >> 8), 0x17, 1);

    let finalArray = bytes.slice(0, pos);
    return new Blob([finalArray], {type: "application/octet-stream; charset=ISO-8859-1"});
}

// http://www.keiranking.com/phil/
function cksum_region(bytes: Uint8Array, startPos: number, len: number, cksum: number) {
    for (let i = 0; i < len; i++) {
        cksum = (cksum >> 1) | ((cksum & 1) << 15);
        cksum = (cksum + bytes[startPos + i]) & 0xffff;
    }
    
    return cksum; 
}

function insertString(bytes: Uint8Array, str: string, pos: number) {
    for (let i = 0; i < str.length; i++) {
        bytes[pos] = str[i].charCodeAt(0);
        pos++;
    }
}

function insertNumber(bytes: Uint8Array, n: number, pos: number, size: number) {
    for (var index = size-1; index >= 0; --index) {
      bytes[pos] = n % 256;
      n = n >> 8;
      pos++;
    }
}

function sortEntryKeysForPuz(entryKeys: string[]): string[] {
    let sortedKeys = (deepClone(entryKeys) as string[]).sort((a, b) => {
        let aTokens = [a.slice(0, -1), a[-1]];
        let bTokens = [b.slice(0, -1), b[-1]];
        if (aTokens[0] !== bTokens[0]) return +aTokens[0] - +bTokens[0];
        return aTokens[1] < bTokens[1] ? -1 : 1;
    });
    return sortedKeys;
}
