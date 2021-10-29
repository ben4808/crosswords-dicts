import { PuzzleSource, Sources } from "../models/PuzzleSource";
import { parse } from 'node-html-parser';
import { Square } from "../models/Square";
import { Puzzle } from "../models/Puzzle";
import { newPuzzle } from "../lib/puzzle";
import { PuzzleEntry } from "../models/PuzzleEntry";
import { decode } from 'html-entities';

export class NYTSource implements PuzzleSource {
    public id = 1;
    public name = "NYT";

    public async getPuzzles(startDate: Date): Promise<Puzzle[]> {
        return [await this.getPuzzle(startDate)];
    }

    private async getPuzzle(date: Date): Promise<Puzzle> {
        let url = `https://www.xwordinfo.com/Crossword?date=${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
        //url = `https://www.xwordinfo.com/Crossword?date=12/17/2020`;
        let weoriginUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
        let puzzle = newPuzzle(15, 15);
        let response = await fetch(weoriginUrl); 
        let jsonResponse = await response.json();
        let parsedHtml = parse(jsonResponse.contents);

        let title = parsedHtml.querySelector("#PuzTitle").textContent;
        let authors = parsedHtml.querySelectorAll(".bbName > a").map(x => x.textContent);
        if (authors.length === 0) authors = parsedHtml.querySelectorAll(".bbName2 > a").map(x => x.textContent);
        let copyright = `© ${date.getFullYear()}, The New York Times`;
        let notes = parsedHtml.querySelector(".notepad")?.textContent.replace("<b>Notepad:</b>", "") || undefined;
        let puzDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        let source = Sources.NYT;

        let grid = [] as Square[][];
        let puzTable = parsedHtml.querySelector("#PuzTable");
        let rows = puzTable.querySelectorAll("tr");
        let height = rows.length;
        let width = 0;
        rows.forEach((row, ri) => {
            let gridRow = [] as Square[];

            let cols = row.querySelectorAll("td");
            if (width === 0) width = cols.length;
            cols.forEach((col, ci) => {
                let square = {
                    row: ri,
                    col: ci,
                    directions: [],
                    isBlack: false,
                    content: "",
                    isCircled: false,
                } as Square;

                if (col.getAttribute("class")?.includes("black")) {
                    square.isBlack = true;
                    gridRow.push(square);
                    return;
                }

                square.number = +col.querySelector(".num")?.textContent || undefined;
                square.content = col.querySelector(".letter")?.textContent;
                if (!square.content) square.content = col.querySelector(".subst").textContent;
                if (!square.content) square.content = col.querySelector(".subst2").textContent;

                if (col.getAttribute("class")?.includes("shade") || col.getAttribute("class")?.includes("bigcircle")) {
                    square.isCircled = true;
                }

                gridRow.push(square);
            });

            grid.push(gridRow);
        });

        let puzEntries = new Map<string, PuzzleEntry>();

        let acrossClues = parsedHtml.querySelector("#ACluesPan .numclue").childNodes;
        for (let i = 0; i < acrossClues.length; i += 2) {
            let number = +acrossClues[i].innerText;
            let clueText = acrossClues[i+1].innerText;
            let clueMatches = clueText.match(/(?<clue>.*) : (?<entry>[A-Z0-9]+)/)!;
            
            let key = number.toString() + "A";
            puzEntries.set(key, {
                index: key,
                entry: clueMatches.groups ? clueMatches.groups["entry"]: "",
                clue: decode(clueMatches.groups ? clueMatches.groups["clue"] : ""),
            } as PuzzleEntry);
        }

        let downClues = parsedHtml.querySelector("#DCluesPan .numclue").childNodes;
        for (let i = 0; i < downClues.length; i += 2) {
            let number = +downClues[i].innerText;
            let clueText = downClues[i+1].innerText;
            let clueMatches = clueText.match(/(?<clue>.*) : (?<entry>[A-Z0-9]+)/)!;
            
            let key = number.toString() + "D";
            puzEntries.set(key, {
                index: key,
                entry: clueMatches.groups ? clueMatches.groups["entry"]: "",
                clue: decode(clueMatches.groups ? clueMatches.groups["clue"] : ""),
            } as PuzzleEntry);
        }

        puzzle = newPuzzle(width, height);
        puzzle.title = title;
        puzzle.authors = authors;
        puzzle.copyright = copyright;
        puzzle.notes = notes;
        puzzle.date = puzDate;
        puzzle.source = source;
        puzzle.grid = grid;
        puzzle.entries = puzEntries;

        return puzzle;
    }
}