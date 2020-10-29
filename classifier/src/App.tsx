import React, { useEffect, useState } from 'react';
import './App.css';
import Globals from './lib/windowService';
import { qualityClassToWordScore } from './lib/wordLists';
import { QualityClass } from './models/QualityClass';
import { Word } from './models/Word';

function App() {
  const [shownYourWords, setShownYourWords] = useState([] as Word[]);
  const [shownNewWords, setShownNewWords] = useState([] as Word[]);
  const [selectedWord, setSelectedWord] = useState(newWord());
  const [selectedSide, setSelectedSide] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Globals.listsLoaded = listsLoaded;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function listsLoaded() {
    let yourWordSet = getNewSetOfWords(Globals.yourWordList!);
    let newWordSet = getNewSetOfWords(Globals.newWordList!);

    setLoaded(true);
    setShownYourWords(yourWordSet);
    setShownNewWords(newWordSet);
    setSelectedWord(newWordSet[newWordSet.length-1]);
    document.getElementById("container")?.focus();
  }

  function handleWordClick(event: any) {
    let target = event.target;
    while (target.classList.length < 1 || target.classList[0] !== "word") {
        target = target.parentElement;
        if (!target) return;
    }

    let currentWords = deepClone(shownNewWords) as Word[];
    let yourWords = deepClone(shownYourWords) as Word[];

    let yourWord = yourWords.find(x => x.word === target.innerText || target.innerHTML.startsWith(x.word + "<"));
    if (yourWord) {
      setSelectedWord(yourWord);
      setSelectedSide(true);
    }
    else {
      setSelectedWord(currentWords[currentWords.length-1]);
      setSelectedSide(false);
    }
  }

  function handleKeyDown(event: any) {
    let key: string = event.key.toUpperCase();
    let yourWordList = Globals.yourWordList!;
    let newWordList = Globals.newWordList!;

    let currentWords = deepClone(shownNewWords) as Word[];
    let yourWords = deepClone(shownYourWords) as Word[];

    if (key === "W") {
      doProcessKeyDown(yourWordList, newWordList, yourWords, currentWords, word => {
        word.qualityClass = QualityClass.Lively;
        word.categories = new Map<string, boolean>();
      });
    }
    if (key === "A") {
      doProcessKeyDown(yourWordList, newWordList, yourWords, currentWords, word => {
        word.qualityClass = QualityClass.Iffy;
        word.categories = new Map<string, boolean>();
      });
    }
    if (key === "S") {
      doProcessKeyDown(yourWordList, newWordList, yourWords, currentWords, word => {
        word.qualityClass = QualityClass.Crosswordese;
        word.categories = new Map<string, boolean>();
      });
    }
    if (key === "D") {
      doProcessKeyDown(yourWordList, newWordList, yourWords, currentWords, word => {
        word.qualityClass = QualityClass.Normal;
        word.categories = new Map<string, boolean>();
      });
    }
    if (key === "F") {
      doProcessKeyDown(yourWordList, newWordList, yourWords, currentWords, word => {
        word.qualityClass = QualityClass.Normal;
        word.categories = new Map<string, boolean>();
        word.categories.set("Adult", true);
      });
    }
    if (key === "E") {
      doProcessKeyDown(yourWordList, newWordList, yourWords, currentWords, word => {
        word.qualityClass = QualityClass.Normal;
        word.categories = new Map<string, boolean>();
        word.categories.set("Theme", true);
      });
    }

    if (currentWords.length === 0) {
      currentWords = getNewSetOfWords(newWordList);
    }
    if (yourWords.length > 25) {
      yourWords.shift();
    }

    setShownNewWords(currentWords);
    setShownYourWords(yourWords);
    if (!selectedSide && currentWords.length > 0)
      setSelectedWord(currentWords[currentWords.length-1]);
  }

  function doProcessKeyDown(ywl: Word[], nwl: Word[], yw: Word[], nw: Word[], f: (word: Word) => void) {
    let word: Word;
    let globalWord: Word = newWord();

    if (selectedSide) {
      word = yw.find(x => x.word === selectedWord.word)!;
      globalWord = ywl.find(x => x.word === selectedWord.word)!;
    }
    else {
      word = nwl.pop()!;
      nw.pop();
    }

    f(word);
    if (selectedSide) f(globalWord);

    if (!selectedSide) {
      ywl.push(word);
      yw.push(word);
    }
}

  function getWordMarkup(word: Word, showCategories: boolean = false): JSX.Element {
    let categories = [] as string[];
    word.categories.forEach((_, cat) => {
      categories.push(cat);
    });

    return (
      <div key={word.word} className={"word" + 
        (word.word === selectedWord.word ? " word-selected" : "") +
        (word.qualityClass === QualityClass.Unclassified ? " word-unclassified" :
        word.qualityClass === QualityClass.Lively ? " word-lively" :
        word.qualityClass === QualityClass.Normal ? " word-normal" :
        word.qualityClass === QualityClass.Crosswordese ? " word-crosswordese" :
        word.qualityClass === QualityClass.Iffy ? " word-iffy" : "")
      } onClick={handleWordClick}>
        {word.word}
        {showCategories && categories.map(category =>
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
    Globals.yourWordList!.sort((a, b) => a.word > b.word ? 1 : -1);

    let lines = [] as string[];
    lines.push("// No category");
    Globals.yourWordList!.filter(word => word.categories.size === 0).forEach(word => {
      lines.push(`${word.word};${qualityClassToWordScore(word.qualityClass)}`);
    });

    Globals.categories!.forEach(cat => {
      lines.push("");
      lines.push("// " + cat);
      Globals.yourWordList!.filter(word => word.categories.has(cat)).forEach(word => {
        lines.push(`${word.word};${qualityClassToWordScore(word.qualityClass)};${cat}`);
      });
    });
    
    window.open()!.document.write(`<pre>${lines.join("\n")}</pre>`);
  }

  let yourWordList = Globals.yourWordList;
  let newWordList = Globals.newWordList;
  let selectedClues = [] as string[];
  if (Globals.clues && selectedWord && Globals.clues.has(selectedWord.word)) { 
    selectedClues = Globals.clues.get(selectedWord.word)!.slice(0, 20);
  } 

  let newWordsReversed = reverseArray(shownNewWords!);
  let yourWordsReversed = reverseArray(shownYourWords!);

  return (
    <div id="container" className="container" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="mainDiv">
        <button id="save_btn" onClick={save}>Save</button>
        <br></br><br></br>
        {selectedClues.map(clue => getClueMarkup(clue))}
      </div>
      <div className="mainDiv">
        <b>New Word List {loaded ? "(" + newWordList!.length + ")" : 0}</b>
        <br />
        {loaded ? newWordsReversed.map(word => getWordMarkup(word)) : "Loading..."}
      </div>
      <div className="mainDiv">
        <b>Your Word List {loaded ? "(" + yourWordList!.length + ")" : 0}</b>
        <br />
        {loaded ? yourWordsReversed.map(word => getWordMarkup(word, true)) : "Loading..."}
      </div>
    </div>
  );
}

export default App;

function newWord(): Word {
  return {
    word: "",
    qualityClass: QualityClass.Unclassified,
    categories: new Map<string, boolean>(),
    isSelected: false,
  } as Word;
}

function getNewSetOfWords(wordList: Word[]): Word[] {
  let words = wordList.slice(wordList.length-25, wordList.length);
  return words;
}

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

function reverseArray<T>(arr: T[]): T[] {
  var newArray = [];
  for (var i = arr.length - 1; i >= 0; i--) {
    newArray.push(arr[i]);
  }
  return newArray;
}