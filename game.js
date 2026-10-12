"use strict";

const GAME_TIME = 70;
const NUMBER_OF_CARDS = 7;
const MIN_NUMBER = 1;
const MAX_NUMBER = 50;

let numbers = [];
let originalNumbers = []; 
let solutionPasses = []; 
let selectedMode = "bubble";
let timeLeft = GAME_TIME;
let currentPass = 1; 
let timerInterval = null;
let gameStarted = false;
let gameFinished = false;

let draggedIndex = null;
let activeDragCard = null;
let startX = 0;
let startY = 0;

const timerElement = document.getElementById("timer");
const passDisplay = document.getElementById("passDisplay");
const passHint = document.getElementById("passHint");
const modeNameDisplay = document.getElementById("modeNameDisplay");
const numberBoard = document.getElementById("numberBoard");
const origNumbersContainer = document.getElementById("origNumbersContainer");
const feedbackElement = document.getElementById("feedback");

const rulesModal = document.getElementById("rulesModal");
const resultModal = document.getElementById("resultModal");
const infoModal = document.getElementById("infoModal");

const startButton = document.getElementById("startButton");
const submitButton = document.getElementById("submitButton");
const restartButton = document.getElementById("restartButton");
const playAgainButton = document.getElementById("playAgainButton");
const infoButton = document.getElementById("infoButton");
const closeInfoButton = document.getElementById("closeInfoButton");

const bubbleModeButton = document.getElementById("bubbleMode");
const insertionModeButton = document.getElementById("insertionMode");

function generateNumbers() {
  const pool = [];
  for (let i = MIN_NUMBER; i <= MAX_NUMBER; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, NUMBER_OF_CARDS);
}

function generateSolutions(arr, mode) {
  let passes = [];
  let current = [...arr];

  if (mode === "bubble") {
    for (let p = 1; p < arr.length; p++) {
      for (let i = 0; i < arr.length - p; i++) {
        if (current[i] > current[i + 1]) {
          [current[i], current[i + 1]] = [current[i + 1], current[i]];
        }
      }
      passes.push([...current]);
    }
  } else {
    for (let i = 1; i < arr.length; i++) {
      let key = current[i];
      let j = i - 1;
      while (j >= 0 && current[j] > key) {
        current[j + 1] = current[j];
        j--;
      }
      current[j + 1] = key;
      passes.push([...current]);
    }
  }
  return passes;
}

function showFeedback(msg, type = "") {
  feedbackElement.textContent = msg;
  feedbackElement.className = "feedback";
  if (type) feedbackElement.classList.add(type);
}

function updateStats() {
  const maxPassLimit = NUMBER_OF_CARDS - 1;
  
  if (currentPass > maxPassLimit) {
    passDisplay.textContent = "Pass Complete! 🎉";
  } else {
    passDisplay.textContent = `รอบที่ ${currentPass} (Pass ${currentPass})`;
  }

  timerElement.textContent = `${timeLeft}s`;
  timerElement.style.color = timeLeft <= 15 ? "#fca5a5" : "";
  modeNameDisplay.textContent = selectedMode === "bubble" ? "Bubble Sort" : "Insertion Sort";

  if (selectedMode === "bubble") {
    if (currentPass > maxPassLimit) {
      passHint.textContent = `Bubble Sort ทำงานครบทุกรอบเสร็จสมบูรณ์แล้ว!`;
    } else {
      passHint.textContent = `Bubble Pass ${currentPass}: สลับคู่การ์ดที่ติดกันให้จบ Pass นี้แล้วกด Submit เพื่อเช็กทุกตำแหน่ง`;
    }
  } else {
    if (currentPass > maxPassLimit) {
      passHint.textContent = `Insertion Sort ทำงานครบทุกรอบเสร็จสมบูรณ์แล้ว!`;
    } else {
      const activeCount = currentPass + 1;
      passHint.textContent = `Insertion Pass ${currentPass}: จัดเรียง ${activeCount} ตัวแรกทางซ้ายให้ถูกต้อง (ขยับได้เฉพาะการ์ดในกรอบแดง Blaziken)`;
    }
  }
}

function renderOriginalNumbers() {
  origNumbersContainer.innerHTML = "";
  originalNumbers.forEach(num => {
    const chip = document.createElement("span");
    chip.className = "orig-chip";
    chip.textContent = num;
    origNumbersContainer.appendChild(chip);
  });
}

function setMode(mode) {
  selectedMode = mode;
  bubbleModeButton.classList.toggle("active", selectedMode === "bubble");
  insertionModeButton.classList.toggle("active", selectedMode === "insertion");
  
  if (gameStarted) {
    startGame();
  } else {
    updateStats();
  }
}

function renderCards() {
  numberBoard.innerHTML = "";
  numbers.forEach((num, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "number-card";
    card.dataset.index = String(index);

    let isLocked = false;
    let isActiveScope = false;

    if (selectedMode === "bubble") {
      if (index >= NUMBER_OF_CARDS - (currentPass - 1)) {
        isLocked = true;
      }
    } else if (selectedMode === "insertion") {
      if (index <= currentPass) {
        isActiveScope = true;
        isLocked = false;
      } else {
        isActiveScope = false;
        isLocked = true;
      }
    }

    if (isLocked) {
      card.classList.add("locked-card");
      card.disabled = true;
    } else {
      if (isActiveScope) card.classList.add("active-scope");
      card.addEventListener("pointerdown", handlePointerDown);
    }

    let symbolIcon = "⚡";
    if (isLocked) symbolIcon = "🔷";
    else if (isActiveScope) symbolIcon = "🟥";

    card.innerHTML = `
      <span class="card-symbol" aria-hidden="true">${isLocked ? "🔒" : symbolIcon}</span>
      <span class="card-number">${num}</span>
      <span class="slot-number">ช่องที่ ${index + 1}</span>
    `;
    numberBoard.appendChild(card);
  });
}

function startGame() {
  clearInterval(timerInterval);
  numbers = generateNumbers();
  originalNumbers = [...numbers]; 
  solutionPasses = generateSolutions(originalNumbers, selectedMode);
  
  timeLeft = GAME_TIME;
  currentPass = 1;
  gameStarted = true;
  gameFinished = false;

  rulesModal.classList.add("hidden");
  resultModal.classList.add("hidden");
  infoModal.classList.add("hidden");

  renderOriginalNumbers();
  updateStats();
  renderCards();
  showFeedback("เริ่มการต่อสู้ตาใหม่แล้ว! จัดเรียงตามกฎของโหมดในรอบนี้");

  timerInterval = setInterval(() => {
    if (!gameStarted || gameFinished) return;
    timeLeft--;
    updateStats();
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateStats();
      finishGame(false, "หมดเวลาแล้วครับ เทรนเนอร์!");
    }
  }, 1000);
}

function restartGame() { 
  startGame(); 
}

function handlePointerDown(event) {
  if (!gameStarted || gameFinished) return;
  const card = event.currentTarget;
  if (card.classList.contains("locked-card")) return;

  draggedIndex = Number(card.dataset.index);
  activeDragCard = card;
  startX = event.clientX;
  startY = event.clientY;

  card.classList.add("dragging");
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  event.preventDefault();
}

function handlePointerMove(event) {
  if (!activeDragCard) return;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  activeDragCard.style.setProperty("--dx", `${dx}px`);
  activeDragCard.style.setProperty("--dy", `${dy}px`);

  const targetEl = document.elementFromPoint(event.clientX, event.clientY);
  const targetCard = targetEl ? targetEl.closest(".number-card") : null;

  document.querySelectorAll(".number-card").forEach(c => {
    if (c !== activeDragCard) c.classList.remove("drag-over");
  });
  if (targetCard && targetCard !== activeDragCard && !targetCard.classList.contains("locked-card")) {
    targetCard.classList.add("drag-over");
  }
}

function handlePointerUp(event) {
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", handlePointerUp);

  if (!gameStarted || gameFinished || draggedIndex === null) {
    clearDragStyles();
    return;
  }

  const targetEl = document.elementFromPoint(event.clientX, event.clientY);
  const targetCard = targetEl ? targetEl.closest(".number-card") : null;

  if (targetCard && !targetCard.classList.contains("locked-card")) {
    const targetIndex = Number(targetCard.dataset.index);
    if (draggedIndex !== targetIndex) {
      if (selectedMode === "bubble") {
        const distance = Math.abs(draggedIndex - targetIndex);
        if (distance !== 1) {
          showFeedback("Bubble Sort อนุญาตให้สลับการ์ดที่อยู่ติดกันทีละคู่เท่านั้น!", "error");
          clearDragStyles();
          return;
        }
        [numbers[draggedIndex], numbers[targetIndex]] = [numbers[targetIndex], numbers[draggedIndex]];
        showFeedback("สลับการ์ดสำเร็จ จัดเรียงให้จบ Pass แล้วกด Submit เพื่อเช็กทุกตำแหน่ง");
      } else if (selectedMode === "insertion") {
        if (draggedIndex > currentPass || targetIndex > currentPass) {
          showFeedback("Insertion Sort อนุญาตให้ขยับได้เฉพาะการ์ดที่อยู่ในขอบเขตกรอบแดง Blaziken เท่านั้น!", "error");
          clearDragStyles();
          return;
        }
        const [moved] = numbers.splice(draggedIndex, 1);
        numbers.splice(targetIndex, 0, moved);
        showFeedback("ย้ายแทรกการ์ดในขอบเขตสำเร็จ ตรวจสอบความถูกต้องแล้วกดยืนยันรอบนี้");
      }
      renderCards();
    }
  }
  clearDragStyles();
}

function clearDragStyles() {
  if (activeDragCard) {
    activeDragCard.classList.remove("dragging");
    activeDragCard.style.removeProperty("--dx");
    activeDragCard.style.removeProperty("--dy");
  }
  document.querySelectorAll(".number-card").forEach(c => c.classList.remove("dragging", "drag-over"));
  draggedIndex = null;
  activeDragCard = null;
}

function submitAnswer() {
  if (!gameStarted || gameFinished) return;

  const expectedPassState = solutionPasses[currentPass - 1];
  let passValid = true;

  for (let i = 0; i < NUMBER_OF_CARDS; i++) {
    if (numbers[i] !== expectedPassState[i]) {
      passValid = false;
    }
  }

  if (passValid) {
    currentPass++;
    const maxPassLimit = NUMBER_OF_CARDS - 1;
    
    updateStats();

    if (currentPass > maxPassLimit) {
      finishGame(true, "ยอดเยี่ยม! ผ่านการประลองครบทุกรอบตามอัลกอริทึมเรียบร้อยสมบูรณ์");
      return;
    }

    renderCards();
    showFeedback(`เยี่ยมมาก! ผ่านรอบที่ ${currentPass - 1} แล้ว ลุยต่อรอบที่ ${currentPass}`, "success");
  } else {
    showFeedback("รูปแบบตัวเลขใน Pass นี้ยังไม่ถูกต้องทุกตำแหน่ง ลองตรวจสอบการจัดเรียงใหม่นะ", "error");
  }
}

function finishGame(won, msg) {
  clearInterval(timerInterval);
  gameFinished = true;
  gameStarted = false;
  clearDragStyles();

  document.getElementById("resultEmoji").textContent = won ? "🏆" : "⏰";
  document.getElementById("resultTitle").textContent = won ? "ผ่านทุกรอบสมบูรณ์!" : "หมดเวลา!";
  document.getElementById("resultMessage").textContent = msg;

  renderCards();
  resultModal.classList.remove("hidden");
}

// Event Listeners
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
playAgainButton.addEventListener("click", startGame);
submitButton.addEventListener("click", submitAnswer);

bubbleModeButton.addEventListener("click", () => setMode("bubble"));
insertionModeButton.addEventListener("click", () => setMode("insertion"));

infoButton.addEventListener("click", () => infoModal.classList.remove("hidden"));
closeInfoButton.addEventListener("click", () => infoModal.classList.add("hidden"));

// Init
numbers = generateNumbers();
originalNumbers = [...numbers];
solutionPasses = generateSolutions(originalNumbers, "bubble");
renderOriginalNumbers();
renderCards();
updateStats();
setMode("bubble");
rulesModal.classList.remove("hidden");
resultModal.classList.add("hidden");
infoModal.classList.add("hidden");
showFeedback("เลือกโหมดแล้วกดเริ่มต้นการประลองเพื่อลุยทีละ Pass!");