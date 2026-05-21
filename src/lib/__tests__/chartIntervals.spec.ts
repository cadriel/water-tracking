import { computeIntervals, computeRecentBars } from '../chartIntervals';
import type { Reading } from '../../types';

function makeReading(
  takenAt: string,
  reading: number,
  source: 'homeowner' | 'utility' = 'homeowner',
  isEstimated?: boolean,
): Reading {
  return {
    id: `${takenAt}-${reading}`,
    meterId: 'm1',
    reading,
    takenAt,
    createdAt: takenAt,
    source,
    ...(source === 'utility' ? { isEstimated: isEstimated ?? false } : {}),
  };
}

function isoDaysBefore(asOf: Date, days: number, hours = 0): string {
  return new Date(asOf.getTime() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();
}

describe('computeIntervals', () => {
  test('returns [] for empty input', () => {
    expect(computeIntervals([])).toEqual([]);
  });

  test('returns [] for a single reading', () => {
    expect(computeIntervals([makeReading('2026-05-01T08:00:00.000Z', 100)])).toEqual([]);
  });

  test('returns one interval for two readings, with consumption = end - start', () => {
    const result = computeIntervals([
      makeReading('2026-05-01T08:00:00.000Z', 100),
      makeReading('2026-05-08T08:00:00.000Z', 100.5),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].start.reading).toBe(100);
    expect(result[0].end.reading).toBe(100.5);
    expect(result[0].consumption).toBeCloseTo(0.5, 6);
    expect(result[0].isEstimated).toBe(false);
  });

  test('sorts ascending before pairing (unsorted input)', () => {
    const result = computeIntervals([
      makeReading('2026-05-08T08:00:00.000Z', 100.5),
      makeReading('2026-05-01T08:00:00.000Z', 100),
      makeReading('2026-05-04T08:00:00.000Z', 100.2),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].start.takenAt).toBe('2026-05-01T08:00:00.000Z');
    expect(result[0].end.takenAt).toBe('2026-05-04T08:00:00.000Z');
    expect(result[1].start.takenAt).toBe('2026-05-04T08:00:00.000Z');
    expect(result[1].end.takenAt).toBe('2026-05-08T08:00:00.000Z');
  });

  test('marks interval estimated when the start read is an estimated utility read', () => {
    const result = computeIntervals([
      makeReading('2026-05-01T08:00:00.000Z', 100, 'utility', true),
      makeReading('2026-05-08T08:00:00.000Z', 100.5, 'utility', false),
    ]);
    expect(result[0].isEstimated).toBe(true);
  });

  test('marks interval estimated when the end read is an estimated utility read', () => {
    const result = computeIntervals([
      makeReading('2026-05-01T08:00:00.000Z', 100, 'utility', false),
      makeReading('2026-05-08T08:00:00.000Z', 100.5, 'utility', true),
    ]);
    expect(result[0].isEstimated).toBe(true);
  });

  test('does not mark estimated when both reads are actual utility reads', () => {
    const result = computeIntervals([
      makeReading('2026-05-01T08:00:00.000Z', 100, 'utility', false),
      makeReading('2026-05-08T08:00:00.000Z', 100.5, 'utility', false),
    ]);
    expect(result[0].isEstimated).toBe(false);
  });

  test('homeowner reads are never estimated', () => {
    const result = computeIntervals([
      makeReading('2026-05-01T08:00:00.000Z', 100, 'homeowner'),
      makeReading('2026-05-08T08:00:00.000Z', 100.5, 'homeowner'),
    ]);
    expect(result[0].isEstimated).toBe(false);
  });
});

describe('computeRecentBars', () => {
  const now = new Date('2026-05-31T12:00:00.000Z');

  test('returns empty intervals when there are fewer than 2 reads total', () => {
    const result = computeRecentBars([makeReading(isoDaysBefore(now, 5), 100)], now);
    expect(result.intervals).toEqual([]);
  });

  test('uses last30days mode when 6+ reads fall in the 30-day window', () => {
    const readings: Reading[] = [];
    for (let i = 0; i < 6; i++) {
      readings.push(makeReading(isoDaysBefore(now, 25 - i * 4), 100 + i * 0.1));
    }
    const result = computeRecentBars(readings, now);
    expect(result.mode).toBe('last30days');
    expect(result.intervals).toHaveLength(5);
  });

  test('falls back to last12reads mode when fewer than 6 reads in 30-day window', () => {
    // 5 in-window reads + many older reads → fallback to last 12.
    const readings: Reading[] = [];
    // 15 reads, oldest 200 days ago, spaced 13 days apart so only the last 5 fall in 30-day window.
    for (let i = 0; i < 15; i++) {
      readings.push(makeReading(isoDaysBefore(now, (14 - i) * 13), 100 + i * 0.1));
    }
    const result = computeRecentBars(readings, now);
    expect(result.mode).toBe('last12reads');
    expect(result.intervals).toHaveLength(11);
    // First interval's start should be the 12th-most-recent reading.
    expect(result.intervals[0].start.reading).toBeCloseTo(100 + 3 * 0.1, 6);
  });

  test('in last12reads mode, takes the most recent 12 reads even when fewer than 12 exist', () => {
    // Only 3 reads total, all older than 30 days → fallback with 2 intervals.
    const readings: Reading[] = [
      makeReading(isoDaysBefore(now, 100), 100),
      makeReading(isoDaysBefore(now, 80), 100.2),
      makeReading(isoDaysBefore(now, 60), 100.4),
    ];
    const result = computeRecentBars(readings, now);
    expect(result.mode).toBe('last12reads');
    expect(result.intervals).toHaveLength(2);
  });

  test('handles unsorted input', () => {
    const readings: Reading[] = [];
    for (let i = 0; i < 8; i++) {
      readings.push(makeReading(isoDaysBefore(now, 28 - i * 3), 100 + i * 0.1));
    }
    // Shuffle by reversing.
    const result = computeRecentBars(readings.slice().reverse(), now);
    expect(result.mode).toBe('last30days');
    expect(result.intervals).toHaveLength(7);
    // Ascending order verified by checking consumption is non-negative across the sorted pairs.
    for (const interval of result.intervals) {
      expect(new Date(interval.start.takenAt).getTime()).toBeLessThan(
        new Date(interval.end.takenAt).getTime(),
      );
    }
  });
});
