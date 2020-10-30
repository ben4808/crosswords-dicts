import React, { useEffect, useState } from 'react';
import './App.css';
import Globals from './lib/windowService';
import { qualityClassToWordScore } from './lib/wordLists';
import { QualityClass } from './models/QualityClass';
import { Word } from './models/Word';

function App() {
  const [mergedKeys, setMergedKeys] = useState([] as string[]);
  const [newKeys, setNewKeys] = useState([] as string[]);
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedSide, setSelectedSide] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Globals.listsLoaded = listsLoaded;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function listsLoaded() {
    setLoaded(true);
    setMergedKeys(Globals.mergedWordListKeys!);
    setNewKeys(Globals.newWordListKeys!);
    setSelectedKey(Globals.newWordListKeys[0]);
    document.getElementById("container")?.focus();
  }

  function handleWordClick(event: any) {
    let target = event.target;
    while (target.classList.length < 1 || target.classList[0] !== "word") {
        target = target.parentElement;
        if (!target) return;
    }

    let side: boolean = target.className.includes("word-merged");
    let newKey = target.dataset["key"];
    let index = side ? mergedKeys.indexOf(newKey) : newKeys.indexOf(newKey);
    setSelectedKey(newKey);
    setSelectedSide(side);
    setSelectedIndex(index);
  }

  function handleKeyDown(event: any) {
    let key: string = event.key.toUpperCase();

    if (key === "W") {
      doProcessKeyDown(word => {
        word.qualityClass = QualityClass.Lively;
        word.categories = new Map<string, boolean>();
      });
    }
    if (key === "A") {
      doProcessKeyDown(word => {
        word.qualityClass = QualityClass.Iffy;
        word.categories = new Map<string, boolean>();
      });
    }
    if (key === "S") {
      doProcessKeyDown(word => {
        word.qualityClass = QualityClass.Crosswordese;
        word.categories = new Map<string, boolean>();
      });
    }
    if (key === "D") {
      doProcessKeyDown(word => {
        word.qualityClass = QualityClass.Normal;
        word.categories = new Map<string, boolean>();
      });
    }
    if (key === "F") {
      doProcessKeyDown(word => {
        word.qualityClass = QualityClass.Normal;
        word.categories = new Map<string, boolean>();
        word.categories.set("Adult", true);
      });
    }
    if (key === "E") {
      doProcessKeyDown(word => {
        word.qualityClass = QualityClass.Normal;
        word.categories = new Map<string, boolean>();
        word.categories.set("Theme", true);
      });
    }
    if (key === "C") {
      doProcessKeyDown(word => {
        word.qualityClass = QualityClass.Normal;
        word.categories = new Map<string, boolean>();
        word.categories.set("Uncommon", true);
      });
    }

    let newIndex = selectedIndex + 1;
    setSelectedIndex(newIndex);
    if (selectedSide) setSelectedKey(mergedKeys[newIndex]);
    else setSelectedKey(newKeys[newIndex]);
  }

  function doProcessKeyDown(f: (word: Word) => void) {
    let mergedWord = Globals.mergedWordList!.get(selectedKey);
    let newWord = Globals.newWordList!.get(selectedKey);

    if (mergedWord) {
      f(mergedWord);
    }
    if (newWord) {
      f(newWord);
    }
}

  function getWordMarkup(key: string, index: number, side: boolean): JSX.Element {
    let word = side ? Globals.mergedWordList!.get(key)! : Globals.newWordList!.get(key)!;
    let isSelected = selectedSide === side && selectedKey === key && index === selectedIndex;

    let categories = [] as string[];
    word.categories.forEach((_, cat) => {
      categories.push(cat);
    });

    return (
      <div key={word.word} data-key={word.word} className={"word" + 
        (side ? " word-merged" : " word-new") +
        (isSelected ? " word-selected" : "") +
        (word.qualityClass === QualityClass.Unclassified ? " word-unclassified" :
        word.qualityClass === QualityClass.Lively ? " word-lively" :
        word.qualityClass === QualityClass.Normal ? " word-normal" :
        word.qualityClass === QualityClass.Crosswordese ? " word-crosswordese" :
        word.qualityClass === QualityClass.Iffy ? " word-iffy" : "")
      } onClick={handleWordClick}>
        {word.word}
        {categories.map(category =>
          <div key={`${word.word}_${category}`} className="category">{category}</div>
        )}
      </div>
    );
  }

  function getClueMarkup(clue: string): JSX.Element {
    return (
      <div key={clue} className="clue">{clue}</div>
    );
  }

  function save() {
    let lines = [] as string[];
    lines.push("// No category");

    Globals.mergedWordListKeys.forEach(key => {
      let word = Globals.mergedWordList!.get(key)!;
      if (word.categories.size > 0) return;
      lines.push(`${word.word};${qualityClassToWordScore(word.qualityClass)}`);
    });

    Globals.categories!.forEach(cat => {
      lines.push("");
      lines.push("// " + cat);
      Globals.mergedWordListKeys.forEach(key => {
        let word = Globals.mergedWordList!.get(key)!;
        if (!word.categories.has(cat)) return;
        lines.push(`${word.word};${qualityClassToWordScore(word.qualityClass)}`);
      });
    });
    
    window.open()!.document.write(`<pre>${lines.join("\n")}</pre>`);
  }

  let selectedClues = [] as string[];
  if (loaded) {
    let selectedWord = selectedSide ? Globals.mergedWordList!.get(selectedKey)! : Globals.newWordList!.get(selectedKey)!;
    if (Globals.clues && selectedIndex >= 0 && Globals.clues.has(selectedWord.word)) { 
      selectedClues = Globals.clues.get(selectedWord.word)!.slice(0, 20);
    } 
  }

  return (
    <div id="container" className="container" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="mainDiv">
        <button id="save_btn" onClick={save}>Save</button>
        <br /><br />
        {selectedClues.map(clue => getClueMarkup(clue))}
      </div>
      <div className="mainDiv">
        <b>New Word List {loaded ? "(" + newKeys.length + ")" : ""}</b>
        <br />
        {loaded ? newKeys.map((key, i) => getWordMarkup(key, i, false)) : "Loading..."}
      </div>
      <div className="mainDiv">
        <b>Merged Word List {loaded ? "(" + mergedKeys.length + ")" : ""}</b>
        <br />
        {loaded ? mergedKeys.map((key, i) => getWordMarkup(key, i, true)) : "Loading..."}
      </div>
    </div>
  );
}

export default App;

// https://stackoverflow.com/questions/38416020/deep-copy-in-es6-using-the-spread-syntax
export function deepClone(obj: any): any {
  if(typeof obj !== 'object' || obj === null) {
      return obj;
  }

  if(obj instanceof Date) {
      return new Date(obj.getTime());
  }

  if(obj instanceof Map) {
      return new Map(Array.from(obj.entries()));
  }

  if(obj instanceof Array) {
      return obj.reduce((arr, item, i) => {
          arr[i] = deepClone(item);
          return arr;
      }, []);
  }

  if(obj instanceof Object) {
      return Object.keys(obj).reduce((newObj: any, key) => {
          newObj[key] = deepClone(obj[key]);
          return newObj;
      }, {})
  }
}
