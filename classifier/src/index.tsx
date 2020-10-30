import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { loadGinsbergDatabaseCsv, loadMainWordList, mergeWordLists } from './lib/wordLists';
import Globals from './lib/windowService';

Globals.categories = ["Adult", "Theme", "Uncommon"];

loadMainWordList().then(() => {
  loadGinsbergDatabaseCsv().then(() => {
    mergeWordLists();
    Globals.listsLoaded!();
  });
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
