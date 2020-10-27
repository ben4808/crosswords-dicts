import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { loadGinsbergDatabaseCsv, loadMainWordList } from './lib/wordLists';
import Globals from './lib/windowService';

Globals.categories = ["Adult"];

loadMainWordList().then(mwl => {
  Globals.yourWordList = mwl;

  let yourWordMap = new Map<string, boolean>();
  mwl.forEach(word => {
    yourWordMap.set(word.word, true);
  });

  loadGinsbergDatabaseCsv().then(nwl => {
    Globals.newWordList = nwl.filter(word => !yourWordMap.has(word.word));
    Globals.listsLoaded!();
  });
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
