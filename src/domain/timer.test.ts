import { formatClock, remainingMs, remainingSeconds, restProgress } from './timer';

const NOW = 1_700_000_000_000;

describe('timer', () => {
  it('derives the remaining time from endsAt, not from a counter', () => {
    expect(remainingMs(NOW + 90_000, NOW)).toBe(90_000);
    expect(remainingMs(NOW + 90_000, NOW + 30_500)).toBe(59_500);
  });

  it('never goes below zero (e.g. the app was in background past endsAt)', () => {
    expect(remainingMs(NOW, NOW + 5 * 60_000)).toBe(0);
    expect(remainingSeconds(NOW, NOW + 1)).toBe(0);
  });

  it('rounds seconds up so 0 is shown only when time is really over', () => {
    expect(remainingSeconds(NOW + 59_001, NOW)).toBe(60);
    expect(remainingSeconds(NOW + 1, NOW)).toBe(1);
    expect(remainingSeconds(NOW + 90_000, NOW)).toBe(90);
  });

  it('computes linear progress between start and end', () => {
    const start = NOW;
    const end = NOW + 100_000;
    expect(restProgress(start, end, NOW)).toBe(0);
    expect(restProgress(start, end, NOW + 25_000)).toBeCloseTo(0.25);
    expect(restProgress(start, end, NOW + 500_000)).toBe(1);
    expect(restProgress(start, start, NOW)).toBe(1);
  });

  it('formats a clock as m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(90)).toBe('1:30');
    expect(formatClock(600)).toBe('10:00');
  });
});
