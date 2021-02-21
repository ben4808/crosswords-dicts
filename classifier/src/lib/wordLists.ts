import { QualityClass } from "../models/QualityClass";
import { Word } from "../models/Word";
import Globals from '../lib/windowService';
import { ParserOptions } from "../models/ParserOptions";

export async function loadWordLists (
    baseListUrls: string[], 
    baseListParserFunc: (lines: string[], options: ParserOptions) => Word[],
    baseListFilterFunc: (words: Word[]) => Word[],
    baseExcludeIffy: boolean,
    newListUrls: string[],
    newListParserFunc: (lines: string[], options: ParserOptions) => Word[],
    newListFilterFunc: (words: Word[]) => Word[],
    newExludeIffy: boolean,
    length?: number) {

    Globals.mergedWordList = new Map<string, Word>();    
    let words = [] as Word[];
    for (let file of baseListUrls) {
        let response = await fetch("http://localhost/classifier/" + file);
        const lines = (await response.text()).split('\n');
        words = baseListParserFunc(lines, { loadQualityClasses: true, excludeIffy: baseExcludeIffy, length: length });
        words = baseListFilterFunc(words);
    }

    words.forEach(word => {
        Globals.mergedWordList!.set(word.normalizedEntry, word);
    });

    for (let file of newListUrls) {
        let response = await fetch("http://localhost/classifier/" + file);
        const lines = (await response.text()).split('\n');
        words = newListParserFunc(lines, { loadQualityClasses: false, excludeIffy: newExludeIffy, length: length });
        words = newListFilterFunc(words);
    }

    words.forEach(word => {
        if (!Globals.mergedWordList!.has(word.normalizedEntry)) {
            Globals.mergedWordList!.set(word.normalizedEntry, word);
        }
    });
}

export function defaultParserFunc(lines: string[], options: ParserOptions): Word[] {
    let entries = lines.filter(line => line.match(/^[a-zA-Z;]+/));
    let words = [] as Word[];
    entries.forEach(line => {
        let tokens = line.trim().split(";");
        let entry  = tokens[0];
        let normalizedEntry = normalizeWord(entry);
        if (normalizedEntry.length < 2 || normalizedEntry.length > 15) return;
        if (options.length && normalizedEntry.length !== options.length) return;
        let score = tokens.length > 1 ? +tokens[1] : 50;
        let qualityClass = (tokens.length < 2 || !options.loadQualityClasses) ? QualityClass.Unclassified :
            score >= 50 ? QualityClass.Good :
            score >= 40 ? QualityClass.Okay : QualityClass.Iffy;
        if (options.excludeIffy && qualityClass === QualityClass.Iffy) return;

        let categories = new Map<string, boolean>();
        if (tokens.length > 2) {
            for (let i = 2; i < tokens.length; i++) {
                categories.set(tokens[i], true);
            }
        }

        let word = {
            rawEntry: entry,
            normalizedEntry: normalizedEntry,
            qualityClass: qualityClass,
            categories: categories,
        } as Word;

        words.push(word);
    });

    words.sort((a, b) => a.normalizedEntry < b.normalizedEntry ? -1 : 1);
    return words;
}

export function defaultFilterFunc(words: Word[]): Word[] {
    return words;
}

export function normalizeWord(word: string): string {
    return word.replaceAll(/[^\w]/g, "").toUpperCase();
}

export function wordScoreToQualityClass(wordScore: string): QualityClass {
    if (wordScore === "60") return QualityClass.Lively;
    if (wordScore === "50") return QualityClass.Good;
    if (wordScore === "40") return QualityClass.Okay;
    if (wordScore === "25") return QualityClass.Iffy;
    return QualityClass.Unclassified;
}

export function qualityClassToWordScore(qualityClass: QualityClass): string {
    if (qualityClass === QualityClass.Lively) return "60";
    if (qualityClass === QualityClass.Good) return "50";
    if (qualityClass === QualityClass.Okay) return "40";
    if (qualityClass === QualityClass.Iffy) return "25";
    return "";
}

export function parseGoogleVectors(lines: string[], length: number): string[] {
    let ret = [] as string[];
    lines.forEach(line => {
        let newLine = line.replaceAll(/[^a-zA-Z]/g, "");
        newLine = newLine.substring(2);
        if (newLine.length === length) ret.push(newLine);
    });
    ret.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    return ret;
}

export function parseGinsbergDatabaseCsv(lines: string[], options: ParserOptions): Word[] {
    let map = new Map<string, number>();
    let clues = new Map<string, string[]>();

    lines.forEach(line => {
        let tokens = line.trim().split(",");
        let word = tokens[0].toUpperCase();
        tokens.shift();
        let clue = tokens.join(",");
        clue = clue.replace(/^"(.*)"$/, "$1").replaceAll("\"\"", "\"");
        if (options.length && word.length !== options.length) return;

        map.set(word, map.has(word) ? map.get(word)! + 1: 1);
        if (clues.has(word)) clues.get(word)?.push(clue);
        else clues.set(word, [clue]);
    });

    Globals.clues = clues;

    let arr = Array.from(map.keys());
    arr.sort((a, b) => map.get(b)! - map.get(a)!);
    return stringsToWords(arr);
}

export function parsePeterBrodaWordlist(lines: string[], options: ParserOptions): Word[] {
    let words = [] as string[];

    lines.forEach(line => {
        let tokens = line.trim().split(";");
        if (tokens.length !== 2) return;
        let word = tokens[0];
        if (options.length && word.length !== options.length) return;
        if (word.match(/^[A-Z]+$/)) {
            words.push(tokens[0]);
        }
    });

    words.sort();
    return stringsToWords(words);
}

function stringsToWords(strs: string[]): Word[] {
    return strs.map(str => ({
        rawEntry: str,
        normalizedEntry: str,
        qualityClass: QualityClass.Unclassified,
        categories: new Map<string, boolean>(),
    }) as Word);
}