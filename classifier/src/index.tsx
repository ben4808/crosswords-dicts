import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
  // eslint-disable-next-line
import { defaultParserFunc, loadWordLists, parseGinsbergDatabaseCsv, parsePeterBrodaWordlist } from './lib/wordLists';
import Globals from './lib/windowService';
import { QualityClass } from './models/QualityClass';

Globals.categories = ["Adult", "Theme", "Uncommon"];
let length = 8;

// loadMainPlusBroda().then(() => {
//   Globals.listsLoaded!();
// });

// ["peter-broda-wordlist__scored.txt"]
// ["clues.txt"]
// ["phil_wordlist.txt"]
// ["webster_wordlist.txt"]
// ["Entries3.txt"]

loadWordLists(
    ["2s_main.txt", "3ltr_main.txt", "4s_main.txt", "5s_main.txt", "6s_main.txt", "7s_main.txt"],
    defaultParserFunc,
    words => words.filter(w => w.categories.size === 0 && w.qualityClass !== QualityClass.Iffy),
    false,
    ["trimmedBroda.txt"],
    parsePeterBrodaWordlist,
    words => words.filter(w => w.normalizedEntry.length > 7 && w.normalizedEntry.length <= 15),
    false,
    undefined
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
