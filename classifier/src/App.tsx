import React, { memo, useEffect, useState } from 'react';
import './App.css';
import Globals from './lib/windowService';
import { qualityClassToWordScore } from './lib/wordLists';
import { QualityClass } from './models/QualityClass';
import { Word } from './models/Word';
import { WordCompProps } from './models/WordCompProps';

function App() {
  const [mergedKeys, setMergedKeys] = useState([] as string[]);
  const [newKeys, setNewKeys] = useState([] as string[]);
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
    setSelectedIndex(0);
    setSelectedSide(false);
    document.getElementById("container")?.focus();
  }

  function handleWordClick(event: any) {
    let target = event.target;
    while (target.classList.length < 1 || target.classList[0] !== "word") {
        target = target.parentElement;
        if (!target) return;
    }

    let side: boolean = target.className.includes("word-merged");
    let newIndex = +target.dataset["index"];
    setSelectedSide(side);
    setSelectedIndex(newIndex);
  }

  function handleKeyDown(event: any) {
    let key: string = event.key.toUpperCase();
    if (selectedIndex < 0) return;

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
    if ((selectedSide && newIndex >= mergedKeys.length) || (!selectedSide && newIndex >= newKeys.length))
      return;

    setSelectedIndex(newIndex);
  }

  function doProcessKeyDown(f: (word: Word) => void) {
    let key = selectedSide ? Globals.mergedWordListKeys[selectedIndex] : Globals.newWordListKeys[selectedIndex];
    let mergedWord = Globals.mergedWordList!.get(key);
    let newWord = Globals.newWordList!.get(key);

    if (mergedWord) {
      f(mergedWord);
    }
    if (newWord) {
      f(newWord);
    }
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

  function makeAllIffy() {
    if (!window.confirm("Are you sure?")) return;

    alert("Iffy!");
  }

  function submit_word(event: any) {
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      //document.getElementById("myBtn").click();
    }
  }

  function pageBack() {
    alert("Back!");
  }

  function pageForward() {
    alert("Forward!");
  }

  let selectedClues = [] as string[];
  if (loaded) {
    let selectedKey = selectedSide ? Globals.mergedWordListKeys[selectedIndex] : Globals.newWordListKeys[selectedIndex];
    let selectedWord = Globals.mergedWordList!.get(selectedKey)!;
    if (selectedWord && Globals.clues && Globals.clues.has(selectedWord.word)) { 
      selectedClues = Globals.clues.get(selectedWord.word)!.slice(0, 20);
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
        <div className="list_length">Showing 1-100 of 14386</div>
        <input className="my_textbox" type="text" onKeyUp={submit_word}></input>
        <div className="qc_filters">
          {qualityClasses.map(qc => (
            <div key={qc} className="qc_filter">
              <input type="checkbox" id={"checkbox_" + qc} defaultChecked={true}></input>
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
        <div className="mainDiv">
          <b>New Word List {loaded ? "(" + newKeys.length + ")" : ""}</b>
          <br />
          {loaded ? newKeys.map((key, i) => <WordComponent key={key} side={false} index={i} isSelected={selectedSide === false && i === selectedIndex} />) : "Loading..."}
        </div>
        <div className="mainDiv">
          <b>Merged Word List {loaded ? "(" + mergedKeys.length + ")" : ""}</b>
          <br />
          {loaded ? mergedKeys.map((key, i) => <WordComponent key={key} side={true} index={i} isSelected={selectedSide === true && i === selectedIndex} />) : "Loading..."}
        </div>
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

const WordComponent = memo<WordCompProps>(function WordComponent(props) {
  let key = props.side ? Globals.mergedWordListKeys[props.index] : Globals.newWordListKeys[props.index];
  let word = Globals.mergedWordList!.get(key)!;

  let categories = [] as string[];
  word.categories.forEach((_, cat) => {
    categories.push(cat);
  });

  return (
    <div key={word.word} data-index={props.index} className={"word" + 
      (props.side ? " word-merged" : " word-new") +
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
});