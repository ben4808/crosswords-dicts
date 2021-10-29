import { Puzzle } from "./Puzzle";

export interface PuzzleSource {
    id: number;
    name: string;
    getPuzzles: (startDate: Date) => Promise<Puzzle[]>;
}

export enum Sources {
    None,
    NYT,
}