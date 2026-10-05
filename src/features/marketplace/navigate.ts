export function schedulePush(navigate: () => void) {
  window.setTimeout(navigate, 0);
}
