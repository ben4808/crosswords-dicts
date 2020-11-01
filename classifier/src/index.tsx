import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
  // eslint-disable-next-line
import { loadGinsbergDatabaseCsv, loadMainWordList, loadPhilWordList, loadWebsterWordList } from './lib/wordLists';
import Globals from './lib/windowService';

Globals.categories = ["Adult", "Theme", "Uncommon"];

loadMainWordList().then(() => {
  loadGinsbergDatabaseCsv().then(() => {
    Globals.listsLoaded!();
  });
});

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

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
