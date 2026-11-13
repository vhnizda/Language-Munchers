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
