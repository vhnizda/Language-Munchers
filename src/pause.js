export function pauseTimer(timer, now) {
  if (!timer) return null;
  return { remainingMs: Math.max(0, timer.dueAt - now) };
}

export function resumeTimer(timer, now) {
  if (!timer) return null;
  return { dueAt: now + timer.remainingMs };
}
