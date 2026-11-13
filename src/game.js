const LANGUAGES = ['czech', 'german_standard', 'portuguese_pt'];
const BOARD_COLUMNS = 6;
const BOARD_ROWS = 4;
const BOARD_SIZE = BOARD_COLUMNS * BOARD_ROWS;

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createTile({ concept, language, isCorrect, sequence }) {
  return {
    id: `${concept.id}-${language}-${sequence}`,
    conceptId: concept.id,
    language,
    displayText: concept[language],
    english: concept.english,
    isCorrect,
  };
}

function hasSpatialCue(tiles) {
  const rows = Array.from({ length: BOARD_ROWS }, (_, row) =>
    tiles.slice(row * BOARD_COLUMNS, (row + 1) * BOARD_COLUMNS),
  );
  const columns = Array.from({ length: BOARD_COLUMNS }, (_, column) =>
    rows.map((row) => row[column]),
  );

  return [...rows, ...columns].some((line) => {
    const languages = new Set(line.map((tile) => tile.language));
    const concepts = new Set(line.map((tile) => tile.conceptId));
    return languages.size === 1 || concepts.size === 1;
  });
}

function buildCandidateTiles({ topicRows, prompt, random }) {
  const distractors = topicRows.filter((row) => row.id !== prompt.id);
  if (distractors.length < 4) {
    throw new Error('A topic needs at least five concepts to build an MVP board.');
  }

  const tiles = [];
  let sequence = 0;
  for (const language of LANGUAGES) {
    for (let count = 0; count < 4; count += 1) {
      tiles.push(createTile({ concept: prompt, language, isCorrect: true, sequence: sequence++ }));
    }

    const languageDistractors = shuffle(distractors, random)
      .filter((row, index, rows) => (
        rows.findIndex((candidate) => candidate[language] === row[language]) === index
      ))
      .slice(0, 4);
    if (languageDistractors.length < 4) {
      throw new Error(`A topic needs four distinct ${language} distractors to build an MVP board.`);
    }
    for (const concept of languageDistractors) {
      tiles.push(createTile({ concept, language, isCorrect: false, sequence: sequence++ }));
    }
  }
  return tiles;
}

export function createTopicRun(rows, group, random = Math.random) {
  return shuffle(rows.filter((row) => row.group === group), random);
}

export function buildBoard({ topicRows, prompt, random = Math.random }) {
  const candidateTiles = buildCandidateTiles({ topicRows, prompt, random });
  let tiles = candidateTiles;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const shuffled = shuffle(candidateTiles, random);
    if (!hasSpatialCue(shuffled)) {
      tiles = shuffled;
      break;
    }
  }

  return { prompt, tiles };
}

export function isBoardValid(board) {
  if (board.tiles.length !== BOARD_SIZE || hasSpatialCue(board.tiles)) {
    return false;
  }

  const correctTiles = board.tiles.filter((tile) => tile.isCorrect);
  const distractorTiles = board.tiles.filter((tile) => !tile.isCorrect);
  if (correctTiles.length !== 12 || distractorTiles.length !== 12) {
    return false;
  }

  for (const language of LANGUAGES) {
    const languageTiles = board.tiles.filter((tile) => tile.language === language);
    if (languageTiles.length !== 8 || !languageTiles.some((tile) => tile.isCorrect)) {
      return false;
    }
  }

  const distractorKeys = new Set();
  for (const tile of distractorTiles) {
    const key = `${tile.language}:${tile.displayText}`;
    if (distractorKeys.has(key)) {
      return false;
    }
    distractorKeys.add(key);
  }

  return true;
}

export function resolveMunch({ tile, lives }) {
  if (tile.cleared) {
    return { kind: 'ignored', lives, clearTile: false };
  }
  if (tile.isCorrect) {
    return { kind: 'correct', lives, clearTile: true };
  }
  return {
    kind: 'wrong',
    lives: Math.max(0, lives - 1),
    clearTile: true,
    englishMeaning: tile.english,
  };
}

export const boardConfig = {
  columns: BOARD_COLUMNS,
  rows: BOARD_ROWS,
  languages: LANGUAGES,
};
