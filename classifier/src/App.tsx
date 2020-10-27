import React, { useEffect, useState } from 'react';
import './App.css';
import Globals from './lib/windowService';
import { QualityClass } from './models/QualityClass';
import { Word } from './models/Word';

function App() {
  const [shownYourWords, setShownYourWords] = useState([] as Word[]);
  const [shownNewWords, setShownNewWords] = useState([] as Word[]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Globals.listsLoaded = listsLoaded;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function listsLoaded() {
    setLoaded(true);
    setShownYourWords(getNewSetOfWords(Globals.yourWordList!));
    setShownNewWords(getNewSetOfWords(Globals.newWordList!, true));
  }

  function handleWordClick(event: any) {
    let target = event.target;
    while (target.classList.length < 1 || target.classList[0] !== "word") {
        target = target.parentElement;
        if (!target) return;
    }

    console.log(target);
  }

  function handleKeyDown(event: any) {
    let key: string = event.key.toUpperCase();
    console.log(key);
  }

  function getWordMarkup(word: Word): JSX.Element {
    return (
      <div key={word.word} className={"word" + 
        (word.isSelected ? " word-selected" : "") +
        (word.qualityClass === QualityClass.Unclassified ? " word-unclassified" :
        word.qualityClass === QualityClass.Lively ? " word-lively" :
        word.qualityClass === QualityClass.Normal ? " word-normal" :
        word.qualityClass === QualityClass.Crosswordese ? " word-crosswordese" :
        word.qualityClass === QualityClass.Iffy ? " word-iffy" : "")
      } onClick={handleWordClick}>
        {word.word}
      </div>
    );
  }
  // {categories!.map(category =>
  //   <div key={`${word.word}_${category}`} className={"category" + (word.categories.get(category) ? " category-selected" : "")}>{category}</div>
  // )}

  let yourWordList = Globals.yourWordList;
  let newWordList = Globals.newWordList;
  //let categories = Globals.categories;

  return (
    <div className="container" onKeyDown={handleKeyDown}>
      <div className="mainDiv">
        <b>New Word List {loaded ? "(" + newWordList!.length + ")" : 0}</b>
        <br />
        {loaded ? shownNewWords!.map(word => getWordMarkup(word)) : "Loading..."}
      </div>
      <div className="mainDiv">
        <b>Your Word List {loaded ? "(" + yourWordList!.length + ")" : 0}</b>
        <br />
        {loaded ? shownYourWords!.map(word => getWordMarkup(word)) : "Loading..."}
      </div>
    </div>
  );
}

export default App;

function getNewSetOfWords(wordList: Word[], selectFirst: boolean = false): Word[] {
  let words = wordList.slice(wordList.length-25, wordList.length);
  if (selectFirst) words[0].isSelected = true;
  return words;
}