export function shouldMunchOnTileTap({ focusedIndex, tappedIndex, isPending }) {
  return focusedIndex === tappedIndex && !isPending;
}
