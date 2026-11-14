import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('game screen uses touch-first instructions and a status-bar pause button', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.doesNotMatch(html, /id="munch-button"|class="arrow-pad"|data-move=/);
  assert.match(html, /<button id="pause-button" class="leave-button" type="button">PAUSE<\/button>/);
  assert.match(html, /Click or tap a tile to move, then tap it again to eat it\. With a keyboard, use Arrow keys to move and Space to eat\./);
});

test('lives use frog sprites instead of text circles', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

  assert.match(app, /function renderLives\(lives\)/);
  assert.match(app, /life-frog/);
  assert.doesNotMatch(app, /livesElement\.textContent = '●'/);
});

test('language flags use local SVG images and never disable the final selection', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

  const languageToggleRenderer = app.match(/function renderLanguageToggles\(\) \{([\s\S]*?)\n\}/)?.[1];

  assert.ok(languageToggleRenderer, 'language toggle renderer must exist');
  assert.match(app, /assets\/flags\/cz\.svg/);
  assert.match(languageToggleRenderer, /flag\.src/);
  assert.doesNotMatch(languageToggleRenderer, /button\.disabled/);
  assert.match(languageToggleRenderer, /if \(enabled && selectedLanguages\.size === 1\) return;/);
});

test('styles provide room for frog lives and keep the instructions centered', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.match(css, /\.lives-panel \{/);
  assert.match(css, /\.life-frog \{/);
  assert.match(css, /\.play-instructions \{[^}]*text-align:\s*center/);
});
