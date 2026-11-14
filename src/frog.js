export const FROG_EAT_ANIMATION = 'eating';
export const FROG_EAT_DURATION_MS = 360;

const DIRECTION_ANIMATIONS = {
  up: 'jump-up',
  down: 'jump-down',
  left: 'jump-left',
  right: 'jump-right',
};

export function frogAnimationForMove(direction, { isTouch = false } = {}) {
  if (isTouch) return DIRECTION_ANIMATIONS.up;
  return DIRECTION_ANIMATIONS[direction] ?? DIRECTION_ANIMATIONS.up;
}
