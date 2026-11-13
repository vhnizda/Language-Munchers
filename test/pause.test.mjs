import assert from 'node:assert/strict';
import test from 'node:test';

import { pauseTimer, resumeTimer } from '../src/pause.js';

test('pauseTimer preserves the remaining wrong-answer feedback time', () => {
  assert.deepEqual(pauseTimer({ dueAt: 2_000 }, 1_250), { remainingMs: 750 });
});

test('resumeTimer schedules from the resume time', () => {
  assert.deepEqual(resumeTimer({ remainingMs: 750 }, 5_000), { dueAt: 5_750 });
});

test('timer pause helpers leave absent feedback timers absent', () => {
  assert.equal(pauseTimer(null, 1_000), null);
  assert.equal(resumeTimer(null, 1_000), null);
});
