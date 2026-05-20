import type { Reading } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function averageBetween(earliest: Reading, latest: Reading): number | null {
  const daysBetween =
    (new Date(latest.takenAt).getTime() - new Date(earliest.takenAt).getTime()) / MS_PER_DAY;
  if (daysBetween < 1) return null;
  return ((latest.reading - earliest.reading) * 1000) / daysBetween;
}

function sortAscending(readings: Reading[]): Reading[] {
  return readings.slice().sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));
}

export function averageDailyUsageLitres(readings: Reading[]): number | null {
  if (readings.length < 2) return null;
  const sorted = sortAscending(readings);
  return averageBetween(sorted[0], sorted[sorted.length - 1]);
}

export function averageDailyUsageLitresInLastNDays(
  readings: Reading[],
  days: number,
  asOf: Date = new Date(),
): number | null {
  const windowStart = asOf.getTime() - days * MS_PER_DAY;
  const inWindow = readings.filter(r => new Date(r.takenAt).getTime() >= windowStart);
  if (inWindow.length < 2) return null;
  const sorted = sortAscending(inWindow);
  return averageBetween(sorted[0], sorted[sorted.length - 1]);
}

export function averageBetweenLastUtilityReadings(readings: Reading[]): number | null {
  const utilities = readings.filter(r => r.source === 'utility');
  if (utilities.length < 2) return null;
  const sorted = sortAscending(utilities);
  const prev = sorted[sorted.length - 2];
  const latest = sorted[sorted.length - 1];
  return averageBetween(prev, latest);
}
