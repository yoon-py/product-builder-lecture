const boardEl = document.getElementById('board');
const turnText = document.getElementById('turnText');
const scoreText = document.getElementById('scoreText');
const resetBtn = document.getElementById('resetBtn');
const clearScoreBtn = document.getElementById('clearScoreBtn');
const undoBtn = document.getElementById('undoBtn');
const playerLabel = document.getElementById('playerLabel');
const aiLabel = document.getElementById('aiLabel');
const difficultySelect = document.getElementById('difficultySelect');
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
let history = [];
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

function updateStatus() {
  if (gameOver) return;
  const currentSymbol = xIsNext ? 'X' : 'O';
  const actor = currentSymbol === playerSymbol ? '내 차례' : 'AI 차례';
  turnText.textContent = `${currentSymbol} · ${actor}`;
  scoreText.textContent = `무승부 ${scores.draw} · 플레이어 ${scores.player} : ${scores.ai} AI`;
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
    turnText.textContent = `${winner} 승리!`;
    recordHistory(`${winner} 승리`);
    showToast(`${winner} 승리!`);
    updateControls();
    return;
  }

  if (isDraw()) {
    gameOver = true;
    scores.draw += 1;
    turnText.textContent = '무승부!';
    recordHistory('무승부');
    showToast('무승부!');
    updateControls();
  }
}

function placeMove(index, player) {
  if (board[index] || gameOver) return;
  board[index] = player;
  history.push(index);
  xIsNext = player === 'O';
  renderBoard();
  updateStatus();
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

function swapRoles() {
  playerSymbol = playerSymbol === 'X' ? 'O' : 'X';
  aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
  playerLabel.textContent = `플레이어: ${playerSymbol}`;
  aiLabel.textContent = `AI: ${aiSymbol}`;
}

function resetGame() {
  board = Array(9).fill(null);
  history = [];
  gameOver = false;
  xIsNext = true;
  renderBoard();
  updateStatus();
  updateControls();
  triggerAIMoveIfNeeded();
}

function undoMove() {
  if (history.length === 0 || gameOver) return;
  const last = history.pop();
  if (last === undefined) return;
  board[last] = null;
  xIsNext = !xIsNext;
  renderBoard();
  updateStatus();
}

function clearScores() {
  scores = { player: 0, ai: 0, draw: 0 };
  updateStatus();
  showToast('점수를 초기화했습니다');
}

function clearHistory() {
  historyList.innerHTML = '';
  showToast('기록을 지웠습니다');
}

resetBtn.addEventListener('click', () => {
  swapRoles();
  resetGame();
});
clearScoreBtn.addEventListener('click', clearScores);
undoBtn.addEventListener('click', undoMove);
clearHistoryBtn.addEventListener('click', clearHistory);
difficultySelect.addEventListener('change', () => {
  showToast(`난이도: ${difficultySelect.options[difficultySelect.selectedIndex].text}`);
});

resetGame();
