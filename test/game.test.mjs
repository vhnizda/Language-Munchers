import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBoard,
  createTopicRun,
  isBoardValid,
  resolveMunch,
} from '../src/game.js';

const TOPIC_ROWS = [
  {
    id: '001',
    group: 'Family and people',
    english: 'family',
    czech: 'rodina',
    german_standard: 'die Familie',
    portuguese_pt: 'a família',
  },
  {
    id: '002',
    group: 'Family and people',
    english: 'mother',
    czech: 'máma / matka',
    german_standard: 'die Mutter',
    portuguese_pt: 'a mãe',
  },
  {
    id: '003',
    group: 'Family and people',
    english: 'father',
    czech: 'táta / otec',
    german_standard: 'der Vater',
    portuguese_pt: 'o pai',
  },
  {
    id: '004',
    group: 'Family and people',
    english: 'parents',
    czech: 'rodiče',
    german_standard: 'die Eltern',
    portuguese_pt: 'os pais',
  },
  {
    id: '005',
    group: 'Family and people',
    english: 'baby',
    czech: 'miminko',
    german_standard: 'das Baby',
    portuguese_pt: 'o bebé',
  },
  {
    id: '006',
    group: 'Family and people',
    english: 'sibling',
    czech: 'sourozenec',
    german_standard: 'das Geschwister',
    portuguese_pt: 'o irmão / a irmã',
  },
];

function deterministicRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

test('createTopicRun returns every selected-topic concept exactly once in a shuffled order', () => {
  const run = createTopicRun(TOPIC_ROWS, 'Family and people', deterministicRandom([0.71, 0.13, 0.88, 0.42]));

  assert.equal(run.length, TOPIC_ROWS.length);
  assert.deepEqual(new Set(run.map((row) => row.id)), new Set(TOPIC_ROWS.map((row) => row.id)));
  assert.notDeepEqual(run.map((row) => row.id), TOPIC_ROWS.map((row) => row.id));
});

test('buildBoard creates a valid 24-tile 10/14 board with eight tiles per language', () => {
  const board = buildBoard({
    topicRows: TOPIC_ROWS,
    prompt: TOPIC_ROWS[0],
    random: deterministicRandom([0.91, 0.22, 0.73, 0.44, 0.65, 0.36, 0.57, 0.18]),
  });

  assert.equal(board.tiles.length, 24);
  assert.equal(board.tiles.filter((tile) => tile.isCorrect).length, 10);
  assert.equal(board.tiles.filter((tile) => !tile.isCorrect).length, 14);
  for (const language of ['czech', 'german_standard', 'portuguese_pt']) {
    assert.equal(board.tiles.filter((tile) => tile.language === language).length, 8);
    assert.ok(board.tiles.some((tile) => tile.language === language && tile.isCorrect));
  }
  assert.ok(isBoardValid(board));
});

test('buildBoard uses only selected languages while preserving a 10/14 board', () => {
  const rows = [
    ...TOPIC_ROWS,
    ...['007', '008'].map((id) => ({
      id,
      group: 'Family and people',
      english: `extra ${id}`,
      czech: `česky ${id}`,
      german_standard: `Deutsch ${id}`,
      portuguese_pt: `português ${id}`,
    })),
  ];
  const board = buildBoard({
    topicRows: rows,
    prompt: TOPIC_ROWS[0],
    languages: ['czech', 'portuguese_pt'],
    random: deterministicRandom([0.91, 0.22, 0.73, 0.44, 0.65, 0.36, 0.57, 0.18]),
  });

  assert.equal(board.tiles.length, 24);
  assert.deepEqual(new Set(board.tiles.map((tile) => tile.language)), new Set(['czech', 'portuguese_pt']));
  assert.equal(board.tiles.filter((tile) => tile.isCorrect).length, 10);
  assert.equal(board.tiles.filter((tile) => !tile.isCorrect).length, 14);
  assert.equal(board.tiles.filter((tile) => tile.language === 'czech').length, 12);
  assert.equal(board.tiles.filter((tile) => tile.language === 'portuguese_pt').length, 12);
  assert.ok(isBoardValid(board));
});

test('buildBoard supports a single selected language', () => {
  const rows = [
    ...TOPIC_ROWS,
    ...Array.from({ length: 9 }, (_, index) => ({
      id: `single-${index}`,
      group: 'Family and people',
      english: `single ${index}`,
      czech: `jedno ${index}`,
      german_standard: `ein ${index}`,
      portuguese_pt: `um ${index}`,
    })),
  ];
  const board = buildBoard({
    topicRows: rows,
    prompt: TOPIC_ROWS[0],
    languages: ['czech'],
    random: deterministicRandom([0.91, 0.22, 0.73, 0.44, 0.65, 0.36, 0.57, 0.18]),
  });

  assert.equal(board.tiles.length, 24);
  assert.equal(board.tiles.filter((tile) => tile.language === 'czech').length, 24);
  assert.ok(isBoardValid(board));
});

test('buildBoard keeps articles and alternatives together as the full CSV field', () => {
  const board = buildBoard({
    topicRows: TOPIC_ROWS,
    prompt: TOPIC_ROWS[1],
    random: deterministicRandom([0.3, 0.8, 0.1, 0.6]),
  });

  const czechCorrect = board.tiles.filter((tile) => tile.isCorrect && tile.language === 'czech');
  assert.ok(czechCorrect.length > 0);
  assert.ok(czechCorrect.every((tile) => tile.displayText === 'máma / matka'));
});

test('buildBoard repeats a deliberately small distractor pool', () => {
  const board = buildBoard({
    topicRows: TOPIC_ROWS,
    prompt: TOPIC_ROWS[0],
    random: deterministicRandom([0.99, 0.01, 0.8, 0.2, 0.6, 0.4]),
  });
  const distractorKeys = board.tiles
    .filter((tile) => !tile.isCorrect)
    .map((tile) => `${tile.language}:${tile.displayText}`);

  assert.ok(new Set(distractorKeys).size < distractorKeys.length);
});

test('resolveMunch does not re-eat a cleared tile', () => {
  const result = resolveMunch({ tile: { id: 'cleared', cleared: true, isCorrect: true }, lives: 2 });

  assert.deepEqual(result, { kind: 'ignored', lives: 2, clearTile: false });
});

test('resolveMunch clears a correct tile without losing a life', () => {
  const result = resolveMunch({ tile: { id: 'a', isCorrect: true }, lives: 3 });

  assert.deepEqual(result, { kind: 'correct', lives: 3, clearTile: true });
});

test('resolveMunch reveals an incorrect tile meaning, clears it, and loses one life', () => {
  const result = resolveMunch({
    tile: { id: 'b', isCorrect: false, english: 'mother' },
    lives: 3,
  });

  assert.deepEqual(result, {
    kind: 'wrong',
    lives: 2,
    clearTile: true,
    englishMeaning: 'mother',
  });
});
