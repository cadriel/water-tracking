import type { Reading } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * MS_PER_DAY;
const MIN_IN_WINDOW_READS = 6;
const LAST_N_READS = 12;

export interface BarInterval {
  start: Reading;
  end: Reading;
  consumption: number;
  isEstimated: boolean;
}

export type RecentBarsMode = 'last30days' | 'last12reads';

export interface RecentBarsResult {
  intervals: BarInterval[];
  mode: RecentBarsMode;
}

function isEstimatedRead(r: Reading): boolean {
  return r.source === 'utility' && r.isEstimated === true;
}

function sortAscending(readings: Reading[]): Reading[] {
  return readings.slice().sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));
}

function pairIntoIntervals(sortedReadings: Reading[]): BarInterval[] {
  const intervals: BarInterval[] = [];
  for (let i = 1; i < sortedReadings.length; i++) {
    const start = sortedReadings[i - 1];
    const end = sortedReadings[i];
    intervals.push({
      start,
      end,
      consumption: end.reading - start.reading,
      isEstimated: isEstimatedRead(start) || isEstimatedRead(end),
    });
  }
  return intervals;
}

export function computeIntervals(readings: Reading[]): BarInterval[] {
  if (readings.length < 2) return [];
  return pairIntoIntervals(sortAscending(readings));
}

export function computeRecentBars(readings: Reading[], now: Date = new Date()): RecentBarsResult {
  const cutoff = now.getTime() - THIRTY_DAYS;
  const sorted = sortAscending(readings);
  const inWindow = sorted.filter(r => new Date(r.takenAt).getTime() >= cutoff);

  if (inWindow.length >= MIN_IN_WINDOW_READS) {
    return { intervals: pairIntoIntervals(inWindow), mode: 'last30days' };
  }

  const lastN = sorted.slice(-LAST_N_READS);
  return { intervals: pairIntoIntervals(lastN), mode: 'last12reads' };
}
