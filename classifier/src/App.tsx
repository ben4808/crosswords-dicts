import React, { useEffect, useReducer, useState } from 'react';
import './App.css';
import Globals from './lib/windowService';
import { normalizeWord, qualityClassToWordScore } from './lib/wordLists';
import { QualityClass } from './models/QualityClass';
import { Word } from './models/Word';

function App() {
  // eslint-disable-next-line
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
  const [shownKeys, setShownKeys] = useState([] as string[]);
  const [selectedKey, setSelectedKey] = useState("");
  const [filteredKeys, setFilteredKeys] = useState([] as string[]);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Globals.listsLoaded = listsLoaded;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function listsLoaded() {
    let filters = [QualityClass.Unclassified];
    setLoaded(true);
    let newFilteredKeys = getFilteredKeys(filters);
    let batchOfKeys = getBatchOfKeys(1, newFilteredKeys);
    setPage(1);
    setFilteredKeys(newFilteredKeys);
    setShownKeys(batchOfKeys);
    setSelectedKey(batchOfKeys[0]);
  }

  function getFilteredKeys(filters: QualityClass[]) {
    let keys = Globals.mergedWordListKeys!;
    return keys.filter(key => filters.includes(Globals.mergedWordList!.get(key)!.qualityClass));
  }

  function getBatchOfKeys(page: number, filteredKeys: string[]): string[] {
    return filteredKeys.slice((page-1)*100, (page-1+1)*100);
  }

  function handleWordClick(event: any) {
    let target = event.target;
    while (target.classList.length < 1 || target.classList[0] !== "word") {
        target = target.parentElement;
        if (!target) return;
    }

    setSelectedKey(target.dataset["wordkey"]);
  }

  function handleKeyDown(event: any) {
    let key: string = event.key.toUpperCase();
    if (selectedKey.length === 0) return;
    let word = Globals.mergedWordList!.get(selectedKey)!;

    if (key === "W") {
      word.qualityClass = QualityClass.Lively;
      word.categories = new Map<string, boolean>();
    }
    if (key === "A") {
      word.qualityClass = QualityClass.Iffy;
      word.categories = new Map<string, boolean>();
    }
    if (key === "S") {
      word.qualityClass = QualityClass.Crosswordese;
      word.categories = new Map<string, boolean>();
    }
    if (key === "D") {
      word.qualityClass = QualityClass.Normal;
      word.categories = new Map<string, boolean>();
    }
    if (key === "F") {
      word.qualityClass = QualityClass.Normal;
      word.categories = new Map<string, boolean>();
      word.categories.set("Adult", true);
    }
    if (key === "E") {
      word.qualityClass = QualityClass.Normal;
      word.categories = new Map<string, boolean>();
      word.categories.set("Theme", true);
    }
    if (key === "C") {
      word.qualityClass = QualityClass.Normal;
      word.categories = new Map<string, boolean>();
      word.categories.set("Uncommon", true);
    }
    if (key === "Z") {
      word.qualityClass = QualityClass.Unclassified;
      word.categories = new Map<string, boolean>();
    }

    let selectedIndex = shownKeys.indexOf(selectedKey);
    selectedIndex++;
    if (selectedIndex === 100) {
      let newPage = page + 1;
      let newShownKeys = getBatchOfKeys(newPage, filteredKeys);
      if (newShownKeys.length === 0) return;
      setPage(newPage);
      setShownKeys(newShownKeys);
      setSelectedKey(newShownKeys[0]);
      return;
    }

    setSelectedKey(shownKeys[selectedIndex]);
  }

  function getClueMarkup(clue: string): JSX.Element {
    return (
      <div key={clue} className="clue">{clue}</div>
    );
  }

  function save() {
    let lines = [] as string[];
    lines.push("// No category");

    let keys = deepClone(Globals.mergedWordListKeys) as string[];
    keys.sort();

    keys.forEach(key => {
      let word = Globals.mergedWordList!.get(key)!;
      if (word.categories.size > 0) return;
      if (word.qualityClass === QualityClass.Unclassified) return;
      lines.push(`${key};${qualityClassToWordScore(word.qualityClass)}`);
    });

    Globals.categories!.forEach(cat => {
      lines.push("");
      lines.push("// " + cat);
      keys.forEach(key => {
        let word = Globals.mergedWordList!.get(key)!;
        if (!word.categories.has(cat)) return;
        if (word.qualityClass === QualityClass.Unclassified) return;
        lines.push(`${key};${qualityClassToWordScore(word.qualityClass)}`);
      });
    });
    
    window.open()!.document.write(`<pre>${lines.join("\n")}</pre>`);
  }

  function makeAllIffy() {
    if (!window.confirm("Are you sure?")) return;

    Globals.mergedWordList!.forEach((word, key) => {
      if (word.qualityClass === QualityClass.Unclassified)
        word.qualityClass = QualityClass.Iffy;
    });

    forceUpdate();
  }

  function submit_word(event: any) {
    if (event.keyCode !== 13) return;
    event.preventDefault();
    let newWord = event.target.value as string;
    event.target.value = "";
    let newKey = normalizeWord(newWord);

    if (Globals.mergedWordList!.has(newKey)) return;

    let newWordObj = {
      word: newWord,
      qualityClass: QualityClass.Unclassified,
      categories: new Map<string, boolean>(),
    } as Word;

    Globals.mergedWordList!.set(newKey, newWordObj);
    Globals.mergedWordListKeys!.unshift(newKey);

    changeFilters();
  }

  function pageBack() {
    if (page === 1) return;
    let newPage = page - 1;
    let newBatch = getBatchOfKeys(newPage, filteredKeys);
    setPage(newPage);
    setShownKeys(newBatch);
    setSelectedKey(newBatch[0]);
  }

  function pageForward() {
    let newPage = page + 1;
    let newBatch = getBatchOfKeys(newPage, filteredKeys);
    if (newBatch.length === 0) return;
    setPage(newPage);
    setShownKeys(newBatch);
    setSelectedKey(newBatch[0]);
  }

  function changeFilters() {
    let qualityClasses = [] as QualityClass[];
    for(let c in QualityClass) {
      if (isNaN(Number(c)) && (document.getElementById(`checkbox_${c}`) as HTMLInputElement)!.checked) {
        qualityClasses.push(QualityClass[c as keyof typeof QualityClass]);
      }
    }

    let newKeys = getFilteredKeys(qualityClasses);
    let newBatch = getBatchOfKeys(1, newKeys);
    setPage(1);
    setFilteredKeys(newKeys);
    setShownKeys(newBatch);
    setSelectedKey(newBatch[0]);
  }

  let selectedClues = [] as string[];
  if (loaded) {
    if (selectedKey && Globals.clues && Globals.clues.has(selectedKey)) { 
      selectedClues = Globals.clues.get(selectedKey)!.slice(0, 20);
    } 
  }

  let qualityClasses = [] as string[];
  for(let c in QualityClass) {
    if (isNaN(Number(c))) {
      qualityClasses.push(c);
    }
  }

  return (
    <>
      <div id="topbar">
        {loaded ? <div className="list_length">Showing {(page-1)*100+1}-{Math.min(page*100,filteredKeys.length)} of {filteredKeys.length}</div> : "Loading..."}
        <input className="my_textbox" type="text" onKeyUp={submit_word}></input>
        <div className="qc_filters">
          {qualityClasses.map(qc => (
            <div key={qc} className="qc_filter">
              <input type="checkbox" id={"checkbox_" + qc} defaultChecked={qc==="Unclassified"} onChange={changeFilters}></input>
              <label htmlFor={"checkbox_" + qc}>{qc}</label>
            </div>
          ))}
        </div>
      </div>
      <div id="container" className="container" onKeyDown={handleKeyDown} onClick={handleWordClick} tabIndex={0}>
        <div className="mainDiv">
          <button className="action_button" id="save_btn" onClick={save}>Save</button>
          <button className="action_button" id="all_iffy_btn" onClick={makeAllIffy}>Make All Iffy</button>
          <br /><br />
          {selectedClues.map(clue => getClueMarkup(clue))}
        </div>
        <div className="pageDiv" onClick={pageBack}>&lt;</div>
        {[0, 1, 2, 3].map(n => (
          <div key={n} className="wordListDiv">
            {loaded ? shownKeys.slice(n*25, (n+1)*25).map(key => <WordComponent key={key} wordKey={key} isSelected={selectedKey === key} />) : "Loading..."}
          </div>
        ))}
        <div className="pageDiv" onClick={pageForward}>&gt;</div>
      </div>
    </>
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

interface WordProps {
  wordKey: string;
  isSelected: boolean;
}

const WordComponent = function WordComponent(props: WordProps) {
  let key = props.wordKey;
  let word = Globals.mergedWordList!.get(key)!;

  let categories = [] as string[];
  word.categories.forEach((_, cat) => {
    categories.push(cat);
  });

  return (
    <div key={key} data-wordkey={key} className={"word" + 
      (props.isSelected ? " word-selected" : "") +
      (word.qualityClass === QualityClass.Unclassified ? " word-unclassified" :
      word.qualityClass === QualityClass.Lively ? " word-lively" :
      word.qualityClass === QualityClass.Normal ? " word-normal" :
      word.qualityClass === QualityClass.Crosswordese ? " word-crosswordese" :
      word.qualityClass === QualityClass.Iffy ? " word-iffy" : "")
    }>
      {word.word}
      {categories.map(category =>
        <div key={`${word.word}_${category}`} className="category">{category}</div>
      )}
    </div>
  );
};