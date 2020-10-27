import { QualityClass } from "../models/QualityClass";
import { Word } from "../models/Word";

export async function loadWordList(url: string, parserFunc: (lines: string[]) => string[]): Promise<Word[]> {
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
    var words = parseWordListEntries(entries);
    var t5 = new Date().getTime();
    console.log((t5 - startTime) + " Finished indexing");
    return words;
}

function parseWordListEntries(entries: string[]): Word[] {
    let ret = [] as Word[];
    entries.forEach(entry => {
        let tokens = entry.trim().split(";");
        if (tokens.length === 1) {
            ret.push({
                word: tokens[0],
                qualityClass: QualityClass.Unclassified,
                categories: new Map<string, boolean>(),
                isSelected: false,
            });
        }
        else {
            ret.push({
                word: tokens[0],
                qualityClass: wordScoreToQualityClass(tokens[1]),
                categories: new Map<string, boolean>(),
                isSelected: false,
            })
        }
    });

    return ret;
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

export async function loadMainWordList(): Promise<Word[]> {
    return await loadWordList("http://localhost/classifier/main.txt", parseNormalDict);
}

function parseNormalDict(lines: string[]): string[] {
    return lines;
}

export async function loadGinsbergDatabaseCsv(): Promise<Word[]> {
    return await loadWordList("http://localhost/classifier/clues.txt", parseGinsbergDatabaseCsv);
}

function parseGinsbergDatabaseCsv(lines: string[]): string[] {
    let map = new Map<string, number>();

    lines.forEach(line => {
        let word = line.trim().split(",")[0].toUpperCase();
        if (word.length !== 3) return;

        map.set(word, map.has(word) ? map.get(word)! + 1: 1);
    });

    let arr = Array.from(map.keys());
    arr.sort((a, b) => map.get(a)! - map.get(b)!);
    return arr;
}