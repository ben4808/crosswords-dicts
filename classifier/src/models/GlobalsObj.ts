import { Word } from "./Word";

export interface GlobalsObj {
    mergedWordList?: Map<string, Word>;
    categories?: string[];
    clues?: Map<string, string[]>;

    listsLoaded?: () => void;
}