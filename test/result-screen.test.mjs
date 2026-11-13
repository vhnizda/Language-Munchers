import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('game-over screen uses the encouraging loss message', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

  assert.match(app, /You have lost all your lives\. I'm sure you will do better next time!/);
  assert.doesNotMatch(app, /You used all three lives/);
});

test('game-over screen centers its content and enlarges its title', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const rule = css.match(/#result-screen \{([\s\S]*?)\n\}/)?.[1];
  const titleRule = css.match(/#result-screen h2 \{([\s\S]*?)\n\}/)?.[1];

  assert.ok(rule, 'result screen rule must exist');
  assert.match(rule, /text-align:\s*center/);
  assert.ok(titleRule, 'result title rule must exist');
  assert.match(titleRule, /font-size:\s*clamp\(28px,\s*5vw,\s*48px\)/);
});
