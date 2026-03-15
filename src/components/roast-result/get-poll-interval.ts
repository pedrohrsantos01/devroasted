const FAST_POLL_WINDOW_MS = 60_000;

export function getPollInterval(elapsedMs: number) {
  if (elapsedMs < FAST_POLL_WINDOW_MS) {
    return 2_000;
  }

  return 10_000;
}
