import { PuzzleEntry } from "./PuzzleEntry";
import { Sources } from "./PuzzleSource";
import { Square } from "./Square";

export interface Puzzle {
    title: string;
    authors: string[];
    copyright: string;
    notes?: string;
    date: Date;
    source: Sources;

    grid: Square[][];
    entries: Map<string, PuzzleEntry>;
}
