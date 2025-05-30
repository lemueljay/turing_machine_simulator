import TuringMachine from './tm.js';

let tm = null;
let currentText = "";
let cursorIndex = 0;
let timerId = null;

// Initialize the Turing machine when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", () => {
    initTM();
});

// Initialize the Turing machine with the JSON input and tape input
// and set the head position to the end of the tape
window.initTM = function () {
    try {
        const spec = JSON.parse(document.getElementById("jsonInput").value);
        const tape = document.getElementById("tapeInput").value;
        tm = new TuringMachine(spec, tape);
        tm.head = tm.tape.length - 1;
        syncFromTM();
    } catch (e) {
        alert("JSON parse/validation error:\n" + e.message);
    }
};

// Next step function for the Turing machine
window.stepTM = function () {
    if (!tm) return;
    tm.step();
    syncFromTM();
};

// helper to do one automatic step (so we can reuse it)
function autoStep() {
    if (!tm || tm.halted) {
      clearInterval(timerId);
      timerId = null;
      document.getElementById("playBtn").textContent = "► Play";
      return;
    }
    tm.step();
    syncFromTM();
  }

const speedSlider = document.getElementById("speedSlider");
const speedValue  = document.getElementById("speedValue");
const playBtn     = document.getElementById("playBtn");

speedValue.textContent = `${speedSlider.value}ms`;
speedSlider.addEventListener("input", () => {
    // update the on-screen ms readout
    speedValue.textContent = `${speedSlider.value}ms`;
  
    // if we're in “play” mode, restart the timer at the new rate
    if (timerId) {
      clearInterval(timerId);
      timerId = setInterval(autoStep, parseInt(speedSlider.value, 10));
    }
  });

// Automatic step function for the Turing machine
window.playTM = function () {
    if (!tm) return;

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      document.getElementById("playBtn").textContent = "► Play";
      return;
    }
  
    // set button to "Pause"
    document.getElementById("playBtn").textContent = "❚❚ Pause";

    const getInterval = () => parseInt(document.getElementById("speedSlider").value, 10);
  
    timerId = setInterval(autoStep, parseInt(speedSlider.value, 10));
  };

// Synchronize the Turing machine state with the UI
function syncFromTM() {
    currentText = tm.tape.join("");
    cursorIndex = tm.head;

    const statusEl = document.getElementById("status");
    statusEl.textContent = `State: ${tm.state}${tm.halted ? " (HALTED)" : ""}`;
    const box = document.getElementById("hashes");
    tm.halted ? box.classList.add("halted") : box.classList.remove("halted");

    renderText();
}

// Render the current text on the screen
function renderText() {
    const box = document.getElementById("hashes");
    box.innerHTML = "";
    [...currentText].forEach((ch, i) => {
        const span = document.createElement("span");
        span.textContent = ch;
        if (i === cursorIndex) span.classList.add("cursor");
        box.appendChild(span);
    });
}
