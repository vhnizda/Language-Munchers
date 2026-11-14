import { boardConfig, buildBoard, createTopicRun, resolveMunch } from './src/game.js';
import { pauseTimer, resumeTimer } from './src/pause.js';
import { shouldMunchOnTileTap } from './src/tap-controls.js';
import { FROG_EAT_ANIMATION, FROG_EAT_DURATION_MS, frogAnimationForMove } from './src/frog.js';

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
const languageToggles = document.querySelector('#language-toggles');
const boardElement = document.querySelector('#board');
const feedbackElement = document.querySelector('#feedback');
const pauseDialog = document.querySelector('#pause-dialog');
const fullscreenButton = document.querySelector('#fullscreen-button');
const fullscreenNotice = document.querySelector('#fullscreen-notice');
const topicName = document.querySelector('#topic-name');
const wordProgress = document.querySelector('#word-progress');
const livesElement = document.querySelector('#lives');
const promptWord = document.querySelector('#prompt-word');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');

const LANGUAGE_OPTIONS = [
  { key: 'czech', flag: 'assets/flags/cz.svg', label: 'Czech' },
  { key: 'german_standard', flag: 'assets/flags/de.svg', label: 'German' },
  { key: 'portuguese_pt', flag: 'assets/flags/pt.svg', label: 'Portuguese' },
];

let state = null;
let selectedLanguages = new Set(LANGUAGE_OPTIONS.map((language) => language.key));

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

function clearEatTimer() {
  if (state?.eatTimer?.timeoutId) window.clearTimeout(state.eatTimer.timeoutId);
  if (state) state.eatTimer = null;
}

function resolveCorrectAnswer() {
  const timer = state?.eatTimer;
  if (!timer || state.paused || state.board !== timer.board) return;

  timer.tile.cleared = true;
  state.eatTimer = null;
  state.frogAnimation = 'idle';
  renderGame();
  completeLevelWhenReady();
}

function scheduleCorrectAnswer() {
  const timer = state?.eatTimer;
  if (!timer || state.paused) return;
  timer.timeoutId = window.setTimeout(resolveCorrectAnswer, Math.max(0, timer.dueAt - Date.now()));
}

function resolveWrongAnswer() {
  const timer = state?.wrongTimer;
  if (!timer || state.paused || state.board !== timer.board) return;

  timer.tile.cleared = true;
  state.pendingTiles.delete(timer.tile.id);
  state.wrongTimer = null;
  state.frogAnimation = 'idle';
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
  for (const timer of [state.wrongTimer, state.eatTimer]) {
    if (!timer) continue;
    window.clearTimeout(timer.timeoutId);
    Object.assign(timer, pauseTimer(timer, Date.now()), { timeoutId: null });
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
  if (state.eatTimer) {
    Object.assign(state.eatTimer, resumeTimer(state.eatTimer, Date.now()));
    scheduleCorrectAnswer();
  }
  appShell.classList.remove('is-paused');
  pauseDialog.classList.add('hidden');
  renderGame();
}

function quitTopic() {
  if (!state) return;
  clearWrongTimer();
  clearEatTimer();
  state = null;
  appShell.classList.remove('is-paused');
  pauseDialog.classList.add('hidden');
  renderTopics();
}

function showFullscreenNotice() {
  fullscreenNotice.textContent = 'This browser cannot enter system full screen. Maximize is active. On iPad, use Safari Share → Add to Home Screen, then open Language Munchers from the Home Screen for a screen-filling app.';
  fullscreenNotice.classList.remove('hidden');
}

function hideFullscreenNotice() {
  fullscreenNotice.classList.add('hidden');
}

function toggleCssMaximize() {
  appShell.classList.toggle('maximized');
  if (appShell.classList.contains('maximized')) showFullscreenNotice();
  else hideFullscreenNotice();
  updateFullscreenButton();
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (appShell.classList.contains('maximized')) {
    toggleCssMaximize();
    return;
  }

  const requestFullscreen = appShell.requestFullscreen ?? appShell.webkitRequestFullscreen;
  if (!document.fullscreenEnabled || !requestFullscreen) {
    toggleCssMaximize();
    return;
  }
  try {
    await requestFullscreen.call(appShell, { navigationUI: 'hide' });
    hideFullscreenNotice();
  } catch {
    toggleCssMaximize();
  }
}

function updateFullscreenButton() {
  const isFullscreen = Boolean(document.fullscreenElement) || appShell.classList.contains('maximized');
  fullscreenButton.innerHTML = isFullscreen ? 'EXIT<br />FULL' : 'FULL<br />SCREEN';
  fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit full screen' : 'Enter full screen');
}

function renderLanguageToggles() {
  languageToggles.replaceChildren(...LANGUAGE_OPTIONS.map((language) => {
    const enabled = selectedLanguages.has(language.key);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'language-toggle';
    const flag = document.createElement('img');
    flag.src = language.flag;
    flag.alt = '';
    button.append(flag);
    button.setAttribute('aria-label', `${enabled ? 'Disable' : 'Enable'} ${language.label}`);
    button.setAttribute('aria-pressed', String(enabled));
    button.addEventListener('click', () => {
      if (enabled && selectedLanguages.size === 1) return;
      if (enabled) selectedLanguages.delete(language.key);
      else selectedLanguages.add(language.key);
      renderTopics();
    });
    return button;
  }));
}

function renderLives(lives) {
  livesElement.replaceChildren(...Array.from({ length: 3 }, (_, index) => {
    const life = document.createElement('span');
    life.className = `life-frog${index >= lives ? ' life-frog--lost' : ''}`;
    life.setAttribute('aria-hidden', 'true');
    const sprite = document.createElement('img');
    sprite.src = 'assets/frog-sprites.png';
    sprite.alt = '';
    life.append(sprite);
    return life;
  }));
}

function renderTopics() {
  renderLanguageToggles();
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
    languages: [...selectedLanguages],
    run,
    index: 0,
    lives: 3,
    board: null,
    focus: 0,
    frogAnimation: 'idle',
    pendingTiles: new Set(),
    paused: false,
    wrongTimer: null,
    eatTimer: null,
  };
  show(screens.game);
  startLevel();
}

function startLevel() {
  state.board = buildBoard({
    topicRows: state.run,
    prompt: state.run[state.index],
    languages: state.languages,
  });
  state.focus = 0;
  state.pendingTiles = new Set();
  feedbackElement.textContent = '';
  feedbackElement.className = 'feedback';
  renderGame();
}

function renderGame() {
  const { board, focus, frogAnimation, group, index, run, lives, pendingTiles } = state;
  topicName.textContent = group;
  wordProgress.textContent = `${index + 1} / ${run.length}`;
  renderLives(lives);
  promptWord.textContent = board.prompt.english;
  const tileElements = board.tiles.map((tile, tileIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    const text = document.createElement('span');
    text.className = 'tile-text';
    text.textContent = tile.cleared ? '' : tile.displayText;
    button.append(text);
    button.disabled = pendingTiles.has(tile.id);
    if (tile.cleared) button.classList.add('empty');
    if (tileIndex === focus) {
      button.classList.add('focused');
      const frog = document.createElement('span');
      frog.className = `frog frog--${frogAnimation}`;
      frog.setAttribute('aria-hidden', 'true');
      const frogSprite = document.createElement('img');
      frogSprite.src = 'assets/frog-sprites.png';
      frogSprite.alt = '';
      frog.append(frogSprite);
      button.prepend(frog);
    }
    if (pendingTiles.has(tile.id)) button.classList.add('pending');
    button.addEventListener('pointerdown', (event) => {
      button.dataset.pointerType = event.pointerType;
    });
    button.addEventListener('click', () => {
      if (state.eatTimer) return;
      if (shouldMunchOnTileTap({
        focusedIndex: state.focus,
        tappedIndex: tileIndex,
        isPending: pendingTiles.has(tile.id),
      })) {
        munch();
        return;
      }
      state.focus = tileIndex;
      state.frogAnimation = frogAnimationForMove('up', { isTouch: button.dataset.pointerType === 'touch' });
      renderGame();
    });
    return button;
  });
  boardElement.replaceChildren(...tileElements);
}

function move(direction) {
  if (!state || state.paused || state.eatTimer) return;
  const row = Math.floor(state.focus / boardConfig.columns);
  const column = state.focus % boardConfig.columns;
  const offsets = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
  const [rowOffset, columnOffset] = offsets[direction];
  const nextRow = Math.min(boardConfig.rows - 1, Math.max(0, row + rowOffset));
  const nextColumn = Math.min(boardConfig.columns - 1, Math.max(0, column + columnOffset));
  const nextFocus = nextRow * boardConfig.columns + nextColumn;
  if (nextFocus === state.focus) return;
  state.focus = nextFocus;
  state.frogAnimation = frogAnimationForMove(direction);
  renderGame();
}

function finishTopic(won) {
  clearWrongTimer();
  clearEatTimer();
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
    : "You have lost all your lives. I'm sure you will do better next time!";
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
  if (!state || state.paused || state.eatTimer) return;
  const tile = state.board.tiles[state.focus];
  if (!tile || tile.cleared || state.pendingTiles.has(tile.id)) return;
  const outcome = resolveMunch({ tile, lives: state.lives });
  state.frogAnimation = FROG_EAT_ANIMATION;

  if (outcome.kind === 'correct') {
    feedbackElement.textContent = 'CORRECT!';
    feedbackElement.className = 'feedback';
    renderGame();
    state.eatTimer = {
      board: state.board,
      tile,
      dueAt: Date.now() + FROG_EAT_DURATION_MS,
      timeoutId: null,
    };
    scheduleCorrectAnswer();
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
