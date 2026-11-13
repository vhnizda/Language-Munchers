import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('correct eating clears the word without pending-tile styling or a second animation', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const correctBranch = app.match(/if \(outcome\.kind === 'correct'\) \{([\s\S]*?)\n  \}\n\n  state\.lives/)?.[1];

  assert.ok(correctBranch, 'correct-answer flow must exist');
  assert.doesNotMatch(correctBranch, /pendingTiles\.add/);
  assert.match(app, /function resolveCorrectAnswer\(\)[\s\S]*?state\.frogAnimation = 'idle';/);
});
