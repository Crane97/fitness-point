import { dateKey, formatElapsed, greeting, longDate, parseDateKey, relativeDay } from './dates';

const NOW = new Date(2026, 10, 3, 10, 0).getTime(); // martes 3 nov 2026
const DAY = 86_400_000;

describe('dates', () => {
  it('relative days in Spanish', () => {
    expect(relativeDay(NOW - 1000, NOW)).toBe('Hoy');
    expect(relativeDay(NOW - DAY, NOW)).toBe('Ayer');
    expect(relativeDay(NOW - 3 * DAY, NOW)).toBe('Hace 3 días');
    expect(relativeDay(NOW - 8 * DAY, NOW)).toBe('Hace 1 semana');
    expect(relativeDay(NOW - 20 * DAY, NOW)).toBe('Hace 2 semanas');
  });

  it('formats dates and durations', () => {
    expect(longDate(NOW)).toBe('martes 3 nov');
    expect(formatElapsed(46 * 60_000 + 12_000)).toBe('46:12');
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
    expect(greeting(NOW)).toBe('Buenos días');
  });

  it('round-trips date keys', () => {
    expect(dateKey(NOW)).toBe('2026-11-03');
    expect(dateKey(parseDateKey('2026-02-28'))).toBe('2026-02-28');
  });
});
