import React from 'react';
import './App.css';
import { generatePuzFile } from './lib/puzFiles';
import { NYTSource } from './puzzleSources/NYT';

function App() {
  async function downloadTodaysNyt() {
    let nyt = new NYTSource();
    let now = new Date();
    //now = new Date(2021, 10-1, 26);
    now.setHours(now.getHours() + 3);
    let puzzle = (await nyt.getPuzzles(now))[0];

    let blob = generatePuzFile(puzzle);
    let filename = `NYT_${puzzle.date.getFullYear()}-${puzzle.date.getMonth()+1}-${puzzle.date.getDate()}`;
    if (!puzzle.title.startsWith("New")) filename += "_" + puzzle.title;
    filename += ".puz";
    let file = new File([blob], filename);
    const url= window.URL.createObjectURL(file);
    let puzzleLink = document.getElementById("download-puzzle-link");
    puzzleLink!.setAttribute("href", url);
    puzzleLink!.setAttribute("download", filename);
    puzzleLink!.click();
  }

  return (
    <>
      <a id="download-puzzle-link" href="http://www.example.com" style={{display: "none"}}>stuff</a>
      <div style={{margin: "15px"}} className="btn btn-primary" onClick={downloadTodaysNyt}>Download Today's NYT</div>
    </>
  );
}

export default App;