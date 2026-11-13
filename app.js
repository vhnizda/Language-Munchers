import { boardConfig, buildBoard, createTopicRun, resolveMunch } from './src/game.js';
import { pauseTimer, resumeTimer } from './src/pause.js';
import { shouldMunchOnTileTap } from './src/tap-controls.js';

const vocabulary = await fetch('./data/vocabulary.json').then((response) => {
  if (!response.ok) throw new Error('Could not load vocabulary data.');
  return response.json();
});

const screens = {
  topics: document.querySelector('#topic-screen'),
  game: document.querySelector('#game-screen'),
  result: document.querySelector('#result-screen'),
};
const appShell = document.querySelector('.app-shell');
const topicList = document.querySelector('#topic-list');
const boardElement = document.querySelector('#board');
const feedbackElement = document.querySelector('#feedback');
const pauseDialog = document.querySelector('#pause-dialog');
const fullscreenButton = document.querySelector('#fullscreen-button');
const topicName = document.querySelector('#topic-name');
const wordProgress = document.querySelector('#word-progress');
const livesElement = document.querySelector('#lives');
const promptWord = document.querySelector('#prompt-word');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');

let state = null;

function groups() {
  return [...new Set(vocabulary.map((row) => row.group))];
}

function readProgress() {
  return JSON.parse(localStorage.getItem('language-munchers-progress') ?? '{"wonTopics":[]}');
}

function saveProgress(progress) {
  localStorage.setItem('language-munchers-progress', JSON.stringify(progress));
}

function show(screen) {
  Object.values(screens).forEach((element) => element.classList.add('hidden'));
  screen.classList.remove('hidden');
}

function clearWrongTimer() {
  if (state?.wrongTimer?.timeoutId) window.clearTimeout(state.wrongTimer.timeoutId);
  if (state) state.wrongTimer = null;
}

function resolveWrongAnswer() {
  const timer = state?.wrongTimer;
  if (!timer || state.paused || state.board !== timer.board) return;

  timer.tile.cleared = true;
  state.pendingTiles.delete(timer.tile.id);
  state.wrongTimer = null;
  feedbackElement.textContent = '';
  feedbackElement.className = 'feedback';
  if (state.lives === 0) {
    finishTopic(false);
    return;
  }
  renderGame();
  completeLevelWhenReady();
}

function scheduleWrongAnswer() {
  const timer = state?.wrongTimer;
  if (!timer || state.paused) return;
  timer.timeoutId = window.setTimeout(resolveWrongAnswer, Math.max(0, timer.dueAt - Date.now()));
}

function pauseGame() {
  if (!state || state.paused) return;
  if (state.wrongTimer) {
    window.clearTimeout(state.wrongTimer.timeoutId);
    Object.assign(state.wrongTimer, pauseTimer(state.wrongTimer, Date.now()), { timeoutId: null });
  }
  state.paused = true;
  appShell.classList.add('is-paused');
  pauseDialog.classList.remove('hidden');
  document.querySelector('#continue-button').focus();
}

function resumeGame() {
  if (!state || !state.paused) return;
  state.paused = false;
  if (state.wrongTimer) {
    Object.assign(state.wrongTimer, resumeTimer(state.wrongTimer, Date.now()));
    scheduleWrongAnswer();
  }
  appShell.classList.remove('is-paused');
  pauseDialog.classList.add('hidden');
  renderGame();
}

function quitTopic() {
  if (!state) return;
  clearWrongTimer();
  state = null;
  appShell.classList.remove('is-paused');
  pauseDialog.classList.add('hidden');
  renderTopics();
}

function toggleCssMaximize() {
  appShell.classList.toggle('maximized');
  updateFullscreenButton();
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
    toggleCssMaximize();
    return;
  }
  try {
    await document.documentElement.requestFullscreen();
  } catch {
    toggleCssMaximize();
  }
}

function updateFullscreenButton() {
  const isFullscreen = Boolean(document.fullscreenElement) || appShell.classList.contains('maximized');
  fullscreenButton.innerHTML = isFullscreen ? 'EXIT<br />FULL' : 'FULL<br />SCREEN';
  fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit full screen' : 'Enter full screen');
}

function renderTopics() {
  const progress = readProgress();
  topicList.replaceChildren(...groups().map((group) => {
    const count = vocabulary.filter((row) => row.group === group).length;
    const button = document.createElement('button');
    button.className = 'topic-button';
    button.type = 'button';
    button.innerHTML = `${group}<small>${count} words${progress.wonTopics.includes(group) ? ' · completed' : ''}</small>`;
    button.addEventListener('click', () => startTopic(group));
    return button;
  }));
  show(screens.topics);
}

function startTopic(group) {
  const run = createTopicRun(vocabulary, group);
  state = {
    group,
    run,
    index: 0,
    lives: 3,
    board: null,
    focus: 0,
    pendingTiles: new Set(),
    paused: false,
    wrongTimer: null,
  };
  show(screens.game);
  startLevel();
}

function startLevel() {
  state.board = buildBoard({ topicRows: state.run, prompt: state.run[state.index] });
  state.focus = 0;
  state.pendingTiles = new Set();
  feedbackElement.textContent = '';
  feedbackElement.className = 'feedback';
  renderGame();
}

function renderGame() {
  const { board, focus, group, index, run, lives, pendingTiles } = state;
  topicName.textContent = group;
  wordProgress.textContent = `${index + 1} / ${run.length}`;
  livesElement.textContent = '●'.repeat(lives) + '○'.repeat(3 - lives);
  promptWord.textContent = board.prompt.english;
  const tileElements = board.tiles.map((tile, tileIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    button.textContent = tile.cleared ? '' : tile.displayText;
    button.disabled = pendingTiles.has(tile.id);
    if (tile.cleared) button.classList.add('empty');
    if (tileIndex === focus) button.classList.add('focused');
    if (pendingTiles.has(tile.id)) button.classList.add('pending');
    button.addEventListener('click', () => {
      if (shouldMunchOnTileTap({
        focusedIndex: state.focus,
        tappedIndex: tileIndex,
        isPending: pendingTiles.has(tile.id),
      })) {
        munch();
        return;
      }
      state.focus = tileIndex;
      renderGame();
    });
    return button;
  });
  boardElement.replaceChildren(...tileElements);
}

function move(direction) {
  if (!state || state.paused) return;
  const row = Math.floor(state.focus / boardConfig.columns);
  const column = state.focus % boardConfig.columns;
  const offsets = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
  const [rowOffset, columnOffset] = offsets[direction];
  const nextRow = Math.min(boardConfig.rows - 1, Math.max(0, row + rowOffset));
  const nextColumn = Math.min(boardConfig.columns - 1, Math.max(0, column + columnOffset));
  state.focus = nextRow * boardConfig.columns + nextColumn;
  renderGame();
}

function finishTopic(won) {
  clearWrongTimer();
  appShell.classList.remove('is-paused');
  pauseDialog.classList.add('hidden');
  const progress = readProgress();
  if (won && !progress.wonTopics.includes(state.group)) {
    progress.wonTopics.push(state.group);
    saveProgress(progress);
  }
  resultTitle.textContent = won ? 'TOPIC CLEARED!' : 'GAME OVER';
  resultMessage.textContent = won
    ? `You completed every word in ${state.group}. Choose another topic or play it again with a fresh shuffle.`
    : `You used all three lives in ${state.group}. Try again for a fresh word order.`;
  show(screens.result);
  state = null;
}

function completeLevelWhenReady() {
  if (state.board.tiles.every((tile) => tile.cleared || !tile.isCorrect)) {
    if (state.index === state.run.length - 1) {
      finishTopic(true);
    } else {
      state.index += 1;
      window.setTimeout(startLevel, 450);
    }
  }
}

function munch() {
  if (!state || state.paused) return;
  const tile = state.board.tiles[state.focus];
  if (!tile || tile.cleared || state.pendingTiles.has(tile.id)) return;
  const outcome = resolveMunch({ tile, lives: state.lives });

  if (outcome.kind === 'correct') {
    tile.cleared = true;
    feedbackElement.textContent = 'CORRECT!';
    feedbackElement.className = 'feedback';
    renderGame();
    completeLevelWhenReady();
    return;
  }

  state.lives = outcome.lives;
  state.pendingTiles.add(tile.id);
  feedbackElement.textContent = `${tile.displayText} = ${outcome.englishMeaning}`;
  feedbackElement.className = 'feedback wrong';
  renderGame();
  state.wrongTimer = {
    board: state.board,
    tile,
    dueAt: Date.now() + 1000,
    timeoutId: null,
  };
  scheduleWrongAnswer();
}

document.querySelectorAll('[data-move]').forEach((button) => {
  button.addEventListener('click', () => move(button.dataset.move));
});
document.querySelector('#munch-button').addEventListener('click', munch);
document.querySelector('#pause-button').addEventListener('click', pauseGame);
document.querySelector('#continue-button').addEventListener('click', resumeGame);
document.querySelector('#quit-button').addEventListener('click', quitTopic);
document.querySelector('#return-button').addEventListener('click', renderTopics);
fullscreenButton.addEventListener('click', () => { toggleFullscreen().catch(() => {}); });
document.addEventListener('fullscreenchange', updateFullscreenButton);

document.addEventListener('keydown', (event) => {
  if (!state) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    if (state.paused) resumeGame(); else pauseGame();
    return;
  }
  if (state.paused) return;
  const moves = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  if (moves[event.key]) {
    event.preventDefault();
    move(moves[event.key]);
  }
  if (event.code === 'Space') {
    event.preventDefault();
    munch();
  }
});

renderTopics();
