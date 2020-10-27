import { Word } from "./Word";

// if only I could get useContext to work
export interface GlobalsObj {
    yourWordList?: Word[];
    newWordList?: Word[];
    categories?: string[];

    listsLoaded?: () => void;
}