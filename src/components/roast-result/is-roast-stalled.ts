const STALLED_THRESHOLD_MS = 5 * 60_000;

export function isRoastStalled(elapsedMs: number) {
  return elapsedMs >= STALLED_THRESHOLD_MS;
}
