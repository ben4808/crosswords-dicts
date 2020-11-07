import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
  // eslint-disable-next-line
import { loadBrodaWordList, loadGinsbergDatabaseCsv, loadMainPlusBroda, loadMainWordList, loadPhilWordList, loadWebsterWordList, parsePeterBrodaWordlist } from './lib/wordLists';
import Globals from './lib/windowService';

Globals.categories = ["Adult", "Theme", "Uncommon"];

loadMainPlusBroda().then(() => {
  Globals.listsLoaded!();
});

// loadMainWordList().then(() => {
//   loadGinsbergDatabaseCsv().then(() => {
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
