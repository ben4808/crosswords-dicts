import { QualityClass } from "../models/QualityClass";
import { Word } from "../models/Word";
import Globals from '../lib/windowService';

export async function loadWordList(url: string, parserFunc: (lines: string[]) => string[], isMain: boolean) {
    var startTime = new Date().getTime();
    var response = await fetch(url);
    var t2 = new Date().getTime();
    console.log((t2 - startTime) + " File downloaded");
    const lines = (await response.text()).split('\n');
    var t3 = new Date().getTime();
    console.log((t3 - startTime) + " Read into memory");
    var entries = parserFunc(lines);
    var t4 = new Date().getTime();
    console.log((t4 - startTime) + " Parsed into entries");
    var words = parseWordListEntries(entries, isMain);
    var t5 = new Date().getTime();
    console.log((t5 - startTime) + " Finished indexing");
    return words;
}

export function mergeWordLists(newWordList: Map<string, Word>) {
    let originalWordList = Globals.mergedWordList!;

    newWordList.forEach((word, key) => {
        if (originalWordList.has(key)) {
            let origWord = originalWordList.get(key)!;
            word.qualityClass = origWord.qualityClass;
            word.categories = origWord.categories;
            origWord.word = word.word;
        }
        else {
            word.qualityClass = QualityClass.Unclassified;
            word.categories = new Map<string, boolean>();
            originalWordList.set(key, word);
            Globals.mergedWordListKeys!.push(key);
        }
    });
}

export function normalizeWord(word: string): string {
    return word.replaceAll(/[^\w]/g, "").toUpperCase();
}

function parseWordListEntries(entries: string[], isMain: boolean) {
    let map = new Map<string, Word>();
    let keys = [] as string[];
    entries.forEach(entry => {
        let tokens = entry.trim().split(";");

        if (!isMain && tokens[0].length !== 6) return;

        let categories = new Map<string, boolean>();
        if (tokens.length > 2) {
            for (let i = 2; i < tokens.length; i++) {
                categories.set(tokens[i], true);
            }
        }

        let word = {
            word: tokens[0],
            qualityClass: tokens.length > 1 ? wordScoreToQualityClass(tokens[1]) : QualityClass.Unclassified,
            categories: categories,
        } as Word;

        let normalized = normalizeWord(word.word);
        map.set(normalized, word);
        keys.push(normalized);
    });

    if (isMain) {
        Globals.mergedWordList = map;
        Globals.mergedWordListKeys = keys;
    }
    else {
        mergeWordLists(map);
    }
}

export function wordScoreToQualityClass(wordScore: string): QualityClass {
    if (wordScore === "60") return QualityClass.Lively;
    if (wordScore === "50") return QualityClass.Normal;
    if (wordScore === "40") return QualityClass.Crosswordese;
    if (wordScore === "25") return QualityClass.Iffy;
    return QualityClass.Unclassified;
}

export function qualityClassToWordScore(qualityClass: QualityClass): string {
    if (qualityClass === QualityClass.Lively) return "60";
    if (qualityClass === QualityClass.Normal) return "50";
    if (qualityClass === QualityClass.Crosswordese) return "40";
    if (qualityClass === QualityClass.Iffy) return "25";
    return "";
}

export async function loadMainWordList() {
    await loadWordList("http://localhost/classifier/main.txt", parseNormalDict, true);
}

export async function loadPhilWordList() {
    await loadWordList("http://localhost/classifier/phil_wordlist.txt", parseNormalDict, false);
}

export async function loadWebsterWordList() {
    await loadWordList("http://localhost/classifier/webster_wordlist.txt", parseNormalDict, false);
}

export async function loadBrodaWordList() {
    await loadWordList("http://localhost/peter-broda-wordlist__scored.txt", parsePeterBrodaWordlist, false);
}

export async function loadGinsbergDatabaseCsv() {
    await loadWordList("http://localhost/classifier/clues.txt", parseGinsbergDatabaseCsv, false);
}

function parseNormalDict(lines: string[]): string[] {
    let ret = lines.filter(line => line.match(/^[a-zA-Z;]+/));
    lines.sort();
    return ret;
}

function parseGinsbergDatabaseCsv(lines: string[]): string[] {
    let map = new Map<string, number>();
    let clues = new Map<string, string[]>();

    lines.forEach(line => {
        let tokens = line.trim().split(",");
        let word = tokens[0].toUpperCase();
        tokens.shift();
        let clue = tokens.join(",");
        clue = clue.replace(/^"(.*)"$/, "$1").replaceAll("\"\"", "\"");
        if (word.length !== 6) return;

        map.set(word, map.has(word) ? map.get(word)! + 1: 1);
        if (clues.has(word)) clues.get(word)?.push(clue);
        else clues.set(word, [clue]);
    });

    Globals.clues = clues;

    let arr = Array.from(map.keys());
    arr.sort((a, b) => map.get(b)! - map.get(a)!);
    return arr;
}

export function parsePeterBrodaWordlist(lines: string[]): string[] {
    let words = [] as string[];

    lines.forEach(line => {
        let tokens = line.trim().split(";");
        if (tokens.length !== 2) return;
        let word = tokens[0];
        if (word.length === 6 && word.match(/^[A-Z]+$/)) {
                    words.push(tokens[0]);
                }
    });

    words.sort();
    return words;
}