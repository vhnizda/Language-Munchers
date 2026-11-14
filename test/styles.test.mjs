import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('disabled language X is centered over the flag button', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const rule = css.match(/\.language-toggle\[aria-pressed="false"\]::after \{([\s\S]*?)\n\}/)?.[1];

  assert.ok(rule, 'disabled language X rule must exist');
  assert.match(rule, /inset:\s*50%\s+auto\s+auto\s+50%/);
  assert.match(rule, /transform:\s*translate\(-50%,\s*-50%\)/);
});

test('frog animations advance one whole frame at a time', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const animationRules = css.match(/\.frog--(?:eating|jump-up|jump-down|jump-left|jump-right) img \{[^}]+\}/g) ?? [];

  assert.equal(animationRules.length, 5);
  for (const rule of animationRules) assert.match(rule, /steps\(5, end\)/);
});

test('frog sprite window offsets the sheet 3 pixels up and 10 pixels left', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const rule = css.match(/\.frog img \{([\s\S]*?)\n\}/)?.[1];

  assert.ok(rule, 'frog image crop rule must exist');
  assert.match(rule, /top:\s*-3px/);
  assert.match(rule, /left:\s*-10px/);
});
