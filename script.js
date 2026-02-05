const boardEl = document.getElementById('board');
const scoreText = document.getElementById('scoreText');
const resetBtn = document.getElementById('resetBtn');
const playerSelect = document.getElementById('playerSelect');
const difficultySelect = document.getElementById('difficultySelect');
const gameCard = document.getElementById('gameCard');
const effectLayer = document.getElementById('effectLayer');
const confetti = document.getElementById('confetti');
const resultBanner = document.getElementById('resultBanner');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const toast = document.getElementById('toast');

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let board = Array(9).fill(null);
let xIsNext = true;
let gameOver = false;
let scores = { player: 0, ai: 0, draw: 0 };
let toastTimer = null;
let playerSymbol = 'X';
let aiSymbol = 'O';

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

function updateScore() {
  scoreText.textContent = `플레이어 ${scores.player} : ${scores.ai} AI`;
}

function playResultEffect(type) {
  gameCard.classList.remove('effect-win', 'effect-lose', 'effect-draw');
  if (type) {
    gameCard.classList.add(`effect-${type}`);
    setTimeout(() => {
      gameCard.classList.remove('effect-win', 'effect-lose', 'effect-draw');
    }, 900);
  }
}

function showResultBanner(text) {
  if (!text) {
    resultBanner.classList.remove('show');
    resultBanner.textContent = '';
    return;
  }
  resultBanner.textContent = text;
  resultBanner.classList.add('show');
}

function playOverlayEffect(type) {
  effectLayer.classList.remove('win', 'lose', 'draw');
  if (!type) return;
  effectLayer.classList.add(type);
  setTimeout(() => effectLayer.classList.remove(type), 1000);
}

function launchConfetti() {
  confetti.innerHTML = '';
  const colors = ['#ff6b35', '#ffd166', '#2a9df4', '#6c63ff', '#34d399'];
  for (let i = 0; i < 24; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const angle = Math.random() * Math.PI * 2;
    const distance = 160 + Math.random() * 160;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    piece.style.setProperty('--x', `${x}px`);
    piece.style.setProperty('--y', `${y}px`);
    piece.style.setProperty('--r', `${Math.random() * 360}deg`);
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.appendChild(piece);
  }
  setTimeout(() => {
    confetti.innerHTML = '';
  }, 1200);
}

function renderBoard() {
  boardEl.innerHTML = '';
  board.forEach((value, index) => {
    const cell = document.createElement('button');
    cell.className = `cell ${value ? value.toLowerCase() : ''}`;
    cell.textContent = value ?? '';
    cell.setAttribute('data-index', index.toString());
    const currentSymbol = xIsNext ? 'X' : 'O';
    const isPlayerTurn = currentSymbol === playerSymbol;
    cell.disabled = gameOver || value !== null || !isPlayerTurn;
    cell.addEventListener('click', handleMove);
    boardEl.appendChild(cell);
  });

  const winnerLine = getWinnerLine();
  if (winnerLine) {
    winnerLine.forEach((idx) => {
      const cell = boardEl.children[idx];
      cell.classList.add('winner');
    });
  }
}

function updateControls() {
  resetBtn.disabled = !gameOver;
}

function getWinnerLine() {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

function getWinner() {
  const line = getWinnerLine();
  return line ? board[line[0]] : null;
}

function isDraw() {
  return board.every((cell) => cell !== null);
}

function recordHistory(resultText) {
  const item = document.createElement('li');
  item.className = 'history-item';

  const result = document.createElement('span');
  result.textContent = resultText;

  const time = document.createElement('span');
  time.className = 'history-time';
  time.textContent = new Date().toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  item.appendChild(result);
  item.appendChild(time);

  historyList.prepend(item);
}

function handleEnd() {
  const winner = getWinner();
  if (winner) {
    gameOver = true;
    if (winner === playerSymbol) {
      scores.player += 1;
    } else {
      scores.ai += 1;
    }
    recordHistory(`${winner} 승리`);
    showToast(`${winner} 승리!`);
    playResultEffect(winner === playerSymbol ? 'win' : 'lose');
    playOverlayEffect(winner === playerSymbol ? 'win' : 'lose');
    showResultBanner(null);
    if (winner === playerSymbol) {
      launchConfetti();
    }
    updateScore();
    updateControls();
    return;
  }

  if (isDraw()) {
    gameOver = true;
    scores.draw += 1;
    recordHistory('무승부');
    showToast('무승부!');
    playResultEffect('draw');
    playOverlayEffect('draw');
    showResultBanner(null);
    updateControls();
  }
}

function placeMove(index, player) {
  if (board[index] || gameOver) return;
  board[index] = player;
  xIsNext = player === 'O';
  renderBoard();
  handleEnd();
}

function handleMove(event) {
  const index = Number(event.currentTarget.getAttribute('data-index'));
  if (Number.isNaN(index)) return;

  const currentPlayer = xIsNext ? 'X' : 'O';
  if (currentPlayer !== playerSymbol) return;
  placeMove(index, currentPlayer);

  triggerAIMoveIfNeeded();
}

function aiMove() {
  if (gameOver) return;

  const emptyIndices = board
    .map((value, index) => (value === null ? index : null))
    .filter((value) => value !== null);

  if (!emptyIndices.length) return;

  const difficulty = difficultySelect.value;
  let move = null;

  if (difficulty === 'easy') {
    move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  } else if (difficulty === 'medium') {
    const winMove = findBestMove(aiSymbol);
    const blockMove = findBestMove(playerSymbol);
    const center = board[4] === null ? 4 : null;
    move = winMove ?? blockMove ?? center ?? emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  } else {
    move = findMinimaxMove(aiSymbol);
  }

  placeMove(move, aiSymbol);
}

function findBestMove(player) {
  for (const line of WIN_LINES) {
    const values = line.map((idx) => board[idx]);
    const emptyIndex = line.find((idx) => board[idx] === null);
    if (emptyIndex !== undefined) {
      const countPlayer = values.filter((v) => v === player).length;
      if (countPlayer === 2) {
        return emptyIndex;
      }
    }
  }
  return null;
}

function findMinimaxMove(player) {
  let bestScore = -Infinity;
  let bestMove = null;

  for (const index of board.keys()) {
    if (board[index] !== null) continue;
    board[index] = player;
    const score = minimax(false);
    board[index] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  if (bestMove === null) {
    return board.findIndex((value) => value === null);
  }
  return bestMove;
}

function minimax(isMaximizing) {
  const winner = getWinner();
  if (winner === aiSymbol) return 10;
  if (winner === playerSymbol) return -10;
  if (isDraw()) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const index of board.keys()) {
      if (board[index] !== null) continue;
      board[index] = aiSymbol;
      const score = minimax(false);
      board[index] = null;
      bestScore = Math.max(bestScore, score);
    }
    return bestScore;
  }

  let bestScore = Infinity;
  for (const index of board.keys()) {
    if (board[index] !== null) continue;
    board[index] = playerSymbol;
    const score = minimax(true);
    board[index] = null;
    bestScore = Math.min(bestScore, score);
  }
  return bestScore;
}

function triggerAIMoveIfNeeded() {
  if (gameOver) return;
  const currentSymbol = xIsNext ? 'X' : 'O';
  if (currentSymbol !== aiSymbol) return;
  setTimeout(aiMove, 350);
}

function setRoles(nextPlayerSymbol) {
  playerSymbol = nextPlayerSymbol;
  aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
  playerSelect.value = playerSymbol;
}

function swapRoles() {
  const nextPlayerSymbol = playerSymbol === 'X' ? 'O' : 'X';
  setRoles(nextPlayerSymbol);
}

function resetGame() {
  board = Array(9).fill(null);
  gameOver = false;
  xIsNext = true;
  renderBoard();
  updateScore();
  updateControls();
  playResultEffect(null);
  playOverlayEffect(null);
  showResultBanner(null);
  triggerAIMoveIfNeeded();
}

function clearHistory() {
  historyList.innerHTML = '';
  showToast('기록을 지웠습니다');
}

resetBtn.addEventListener('click', () => {
  swapRoles();
  resetGame();
});
clearHistoryBtn.addEventListener('click', clearHistory);
difficultySelect.addEventListener('change', () => {
  showToast(`난이도: ${difficultySelect.options[difficultySelect.selectedIndex].text}`);
});
playerSelect.addEventListener('change', () => {
  setRoles(playerSelect.value);
  resetGame();
});

resetGame();
