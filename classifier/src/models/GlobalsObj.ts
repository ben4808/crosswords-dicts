import { Word } from "./Word";

// if only I could get useContext to work
export interface GlobalsObj {
    newWordList?: Map<string, Word>;
    newWordListKeys: string[];
    mergedWordList?: Map<string, Word>;
    mergedWordListKeys: string[];
    categories?: string[];
    clues?: Map<string, string[]>;

    listsLoaded?: () => void;
}