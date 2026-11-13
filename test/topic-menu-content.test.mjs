import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('topic menu introduces the completion goal', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /<p class="eyebrow">A retro inspired language game<\/p>/);
  assert.match(html, /<p class="intro">Eat your way to language mastery\. Pick a topic below and complete all the levels\.<\/p>/);
  assert.doesNotMatch(html, /Eat every word in another language/);
});
