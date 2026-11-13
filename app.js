import { boardConfig, buildBoard, createTopicRun, resolveMunch } from './src/game.js';

const vocabulary = await fetch('./data/vocabulary.json').then((response) => {
  if (!response.ok) throw new Error('Could not load vocabulary data.');
  return response.json();
});

const screens = {
  topics: document.querySelector('#topic-screen'),
  game: document.querySelector('#game-screen'),
  result: document.querySelector('#result-screen'),
};
const topicList = document.querySelector('#topic-list');
const boardElement = document.querySelector('#board');
const feedbackElement = document.querySelector('#feedback');
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
  state = { group, run, index: 0, lives: 3, board: null, focus: 0, pendingTiles: new Set() };
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
    button.disabled = tile.cleared || pendingTiles.has(tile.id);
    if (tile.cleared) button.classList.add('empty');
    if (tileIndex === focus && !tile.cleared) button.classList.add('focused');
    if (pendingTiles.has(tile.id)) button.classList.add('pending');
    button.addEventListener('click', () => {
      state.focus = tileIndex;
      renderGame();
    });
    return button;
  });
  boardElement.replaceChildren(...tileElements);
}

function move(direction) {
  if (!state) return;
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
  if (!state) return;
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

  const board = state.board;
  state.lives = outcome.lives;
  state.pendingTiles.add(tile.id);
  feedbackElement.textContent = `${tile.displayText} = ${outcome.englishMeaning}`;
  feedbackElement.className = 'feedback wrong';
  renderGame();
  window.setTimeout(() => {
    if (!state || state.board !== board) return;
    tile.cleared = true;
    state.pendingTiles.delete(tile.id);
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    if (state.lives === 0) {
      finishTopic(false);
      return;
    }
    renderGame();
    completeLevelWhenReady();
  }, 1000);
}

document.querySelectorAll('[data-move]').forEach((button) => {
  button.addEventListener('click', () => move(button.dataset.move));
});
document.querySelector('#munch-button').addEventListener('click', munch);
document.querySelector('#leave-button').addEventListener('click', renderTopics);
document.querySelector('#return-button').addEventListener('click', renderTopics);

document.addEventListener('keydown', (event) => {
  if (!state) return;
  const moves = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  if (moves[event.key]) {
    event.preventDefault();
    move(moves[event.key]);
  }
  if (event.code === 'Space') {
    event.preventDefault();
    munch();
  }
  if (event.key === 'Escape') renderTopics();
});

renderTopics();
