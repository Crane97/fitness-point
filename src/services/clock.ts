/** Single source of "now" so tests and demo screenshots can control time. */
export function now(): number {
  return Date.now();
}
