const boardEl = document.getElementById('board');
const turnText = document.getElementById('turnText');
const scoreText = document.getElementById('scoreText');
const resetBtn = document.getElementById('resetBtn');
const clearScoreBtn = document.getElementById('clearScoreBtn');
const undoBtn = document.getElementById('undoBtn');
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
let scores = { X: 0, O: 0, D: 0 };
let toastTimer = null;

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
    cell.disabled = gameOver || value !== null;
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
  turnText.textContent = `${xIsNext ? 'X' : 'O'} 차례`;
  scoreText.textContent = `X ${scores.X} : ${scores.O} O`;
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
    scores[winner] += 1;
    turnText.textContent = `${winner} 승리!`;
    recordHistory(`${winner} 승리`);
    showToast(`${winner} 승리!`);
    return;
  }

  if (isDraw()) {
    gameOver = true;
    scores.D += 1;
    turnText.textContent = '무승부!';
    recordHistory('무승부');
    showToast('무승부!');
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
  placeMove(index, currentPlayer);

  if (!gameOver && !xIsNext) {
    setTimeout(aiMove, 350);
  }
}

function aiMove() {
  if (gameOver) return;

  const emptyIndices = board
    .map((value, index) => (value === null ? index : null))
    .filter((value) => value !== null);

  if (!emptyIndices.length) return;

  const winMove = findBestMove('O');
  const blockMove = findBestMove('X');
  const center = board[4] === null ? 4 : null;
  const move = winMove ?? blockMove ?? center ?? emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

  placeMove(move, 'O');
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

function resetGame() {
  board = Array(9).fill(null);
  history = [];
  gameOver = false;
  xIsNext = true;
  renderBoard();
  updateStatus();
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
  scores = { X: 0, O: 0, D: 0 };
  updateStatus();
  showToast('점수를 초기화했습니다');
}

function clearHistory() {
  historyList.innerHTML = '';
  showToast('기록을 지웠습니다');
}

resetBtn.addEventListener('click', resetGame);
clearScoreBtn.addEventListener('click', clearScores);
undoBtn.addEventListener('click', undoMove);
clearHistoryBtn.addEventListener('click', clearHistory);

resetGame();
