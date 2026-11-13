import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('vocabulary export retains playable fields and omits notes', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'language-munchers-export-'));
  const output = join(destination, 'vocabulary.json');
  const source = resolve('test/fixtures/vocabulary.csv');

  try {
    const result = spawnSync('node', ['scripts/export-vocabulary.mjs'], {
      cwd: resolve('.'),
      env: { ...process.env, VOCABULARY_SOURCE: source, VOCABULARY_OUTPUT: output },
      encoding: 'utf8',
    });

    assert.equal(result.status, 0, result.stderr);
    const vocabulary = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(vocabulary.length, 2);
    assert.deepEqual(Object.keys(vocabulary[0]), [
      'id',
      'group',
      'english',
      'czech',
      'german_standard',
      'portuguese_pt',
    ]);
    assert.equal(vocabulary[1].czech, 'máma / matka');
    assert.equal('notes' in vocabulary[0], false);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});
