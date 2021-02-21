import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
  // eslint-disable-next-line
import { defaultParserFunc, loadWordLists, parseGinsbergDatabaseCsv } from './lib/wordLists';
import Globals from './lib/windowService';

Globals.categories = ["Adult", "Theme", "Uncommon"];
let length = 6;

// loadMainPlusBroda().then(() => {
//   Globals.listsLoaded!();
// });

loadWordLists(
    ["6s_main.txt"],
    defaultParserFunc,
    words => words.filter(w => w.normalizedEntry.length === length),
    false,
    ["clues.txt"],
    parseGinsbergDatabaseCsv,
    words => words.filter(w => w.normalizedEntry.length === length),
    false,
    length
).then(() => {
  Globals.listsLoaded!();
});

// loadMainWordList().then(() => {
//   loadGinsbergDatabaseCsv().then(() => {
//     Globals.listsLoaded!();
//   });
// });

// loadMainWordList().then(() => {
//   loadGoogleNewsVectors().then(() => {
//     Globals.listsLoaded!();
//   });
// });

// loadMainWordList().then(() => {
//   loadPhilWordList().then(() => {
//     Globals.listsLoaded!();
//   });
// });

// loadMainWordList().then(() => {
//   loadWebsterWordList().then(() => {
//     Globals.listsLoaded!();
//   });
// });

// loadMainWordList().then(() => {
//   loadBrodaWordList().then(() => {
//     Globals.listsLoaded!();
//   });
// });

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
