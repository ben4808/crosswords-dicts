import { Word } from "./Word";

// if only I could get useContext to work
export interface GlobalsObj {
    mergedWordList?: Map<string, Word>;
    mergedWordListKeys: string[];
    categories?: string[];
    clues?: Map<string, string[]>;

    listsLoaded?: () => void;
}