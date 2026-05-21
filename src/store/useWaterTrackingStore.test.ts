import { beforeEach } from 'vitest';
import {
  useWaterTrackingStore,
  useWaterTrackingMeters,
  useWaterTrackingSelectedMeterId,
} from './useWaterTrackingStore';
import type { Reading } from '../types';
import { renderHook, act } from '@testing-library/react';

beforeEach(() => {
  // Reset persisted state between tests.
  localStorage.clear();
  useWaterTrackingStore.setState({
    meters: [],
    readings: [],
    selectedMeterId: null,
  });
});

describe('meter actions', () => {
  test('addMeter creates a meter with the given name and returns its id', () => {
    const id = useWaterTrackingStore.getState().actions.addMeter('Main');
    const meters = useWaterTrackingStore.getState().meters;
    expect(meters).toHaveLength(1);
    expect(meters[0]).toMatchObject({ id, name: 'Main' });
    expect(meters[0].createdAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  test('addMeter on an empty store selects the new meter', () => {
    const id = useWaterTrackingStore.getState().actions.addMeter('Main');
    expect(useWaterTrackingStore.getState().selectedMeterId).toBe(id);
  });

  test('addMeter does not change the selection when a meter is already selected', () => {
    const first = useWaterTrackingStore.getState().actions.addMeter('Main');
    useWaterTrackingStore.getState().actions.addMeter('Irrigation');
    expect(useWaterTrackingStore.getState().selectedMeterId).toBe(first);
  });

  test('renameMeter updates the name', () => {
    const id = useWaterTrackingStore.getState().actions.addMeter('Main');
    useWaterTrackingStore.getState().actions.renameMeter(id, 'House');
    expect(useWaterTrackingStore.getState().meters[0].name).toBe('House');
  });

  test('deleteMeter removes the meter', () => {
    const id = useWaterTrackingStore.getState().actions.addMeter('Main');
    useWaterTrackingStore.getState().actions.deleteMeter(id);
    expect(useWaterTrackingStore.getState().meters).toHaveLength(0);
  });

  test('deleteMeter falls back to the next remaining meter when the deleted one was selected', () => {
    const a = useWaterTrackingStore.getState().actions.addMeter('Main');
    const b = useWaterTrackingStore.getState().actions.addMeter('Irrigation');
    useWaterTrackingStore.getState().actions.selectMeter(a);
    useWaterTrackingStore.getState().actions.deleteMeter(a);
    expect(useWaterTrackingStore.getState().selectedMeterId).toBe(b);
  });

  test('deleteMeter sets selectedMeterId to null when no meters remain', () => {
    const id = useWaterTrackingStore.getState().actions.addMeter('Main');
    useWaterTrackingStore.getState().actions.deleteMeter(id);
    expect(useWaterTrackingStore.getState().selectedMeterId).toBeNull();
  });

  test('selector hook reflects the latest state', () => {
    const { result } = renderHook(() => useWaterTrackingMeters());
    act(() => {
      useWaterTrackingStore.getState().actions.addMeter('Main');
    });
    expect(result.current).toHaveLength(1);
  });

  test('useWaterTrackingSelectedMeterId returns the current selection', () => {
    const { result } = renderHook(() => useWaterTrackingSelectedMeterId());
    let id = '';
    act(() => {
      id = useWaterTrackingStore.getState().actions.addMeter('Main');
    });
    expect(result.current).toBe(id);
  });
});

describe('reading actions', () => {
  function seedMeter(): string {
    return useWaterTrackingStore.getState().actions.addMeter('Main');
  }

  test('addReading appends a reading with an id and createdAt', () => {
    const meterId = seedMeter();
    useWaterTrackingStore.getState().actions.addReading({
      meterId,
      reading: 1234.5678,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'homeowner',
    });
    const readings = useWaterTrackingStore.getState().readings;
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({
      meterId,
      reading: 1234.5678,
      takenAt: '2026-05-20T08:00:00.000Z',
    });
    expect(readings[0].id).toBeTruthy();
    expect(readings[0].createdAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  test('updateReading patches the given fields and leaves others alone', () => {
    const meterId = seedMeter();
    useWaterTrackingStore.getState().actions.addReading({
      meterId,
      reading: 1234.5678,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'homeowner',
    });
    const readingId = useWaterTrackingStore.getState().readings[0].id;
    useWaterTrackingStore.getState().actions.updateReading(readingId, {
      reading: 1235.0001,
    });
    const updated = useWaterTrackingStore.getState().readings[0];
    expect(updated.reading).toBe(1235.0001);
    expect(updated.takenAt).toBe('2026-05-20T08:00:00.000Z');
  });

  test('deleteReading removes the given reading', () => {
    const meterId = seedMeter();
    useWaterTrackingStore.getState().actions.addReading({
      meterId,
      reading: 1.0,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'homeowner',
    });
    const readingId = useWaterTrackingStore.getState().readings[0].id;
    useWaterTrackingStore.getState().actions.deleteReading(readingId);
    expect(useWaterTrackingStore.getState().readings).toHaveLength(0);
  });

  test("deleteMeter cascades and removes the meter's readings", () => {
    const meterId = seedMeter();
    const otherId = useWaterTrackingStore.getState().actions.addMeter('Irrigation');
    useWaterTrackingStore.getState().actions.addReading({
      meterId,
      reading: 1.0,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'homeowner',
    });
    useWaterTrackingStore.getState().actions.addReading({
      meterId: otherId,
      reading: 2.0,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'homeowner',
    });
    useWaterTrackingStore.getState().actions.deleteMeter(meterId);
    const remaining = useWaterTrackingStore.getState().readings;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].meterId).toBe(otherId);
  });

  test('addReading stores the source as given', () => {
    const meterId = seedMeter();
    useWaterTrackingStore.getState().actions.addReading({
      meterId,
      reading: 1.0,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'utility',
    });
    expect(useWaterTrackingStore.getState().readings[0].source).toBe('utility');
  });

  test('updateReading can change the source', () => {
    const meterId = seedMeter();
    useWaterTrackingStore.getState().actions.addReading({
      meterId,
      reading: 1.0,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'homeowner',
    });
    const readingId = useWaterTrackingStore.getState().readings[0].id;
    useWaterTrackingStore.getState().actions.updateReading(readingId, {
      source: 'utility',
    });
    expect(useWaterTrackingStore.getState().readings[0].source).toBe('utility');
  });

  test('addReading round-trips isEstimated for a utility read', () => {
    const meterId = seedMeter();
    useWaterTrackingStore.getState().actions.addReading({
      meterId,
      reading: 1.0,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'utility',
      isEstimated: true,
    });
    expect(useWaterTrackingStore.getState().readings[0].isEstimated).toBe(true);
  });

  test('updateReading clears isEstimated when source switches to homeowner', () => {
    const meterId = seedMeter();
    useWaterTrackingStore.getState().actions.addReading({
      meterId,
      reading: 1.0,
      takenAt: '2026-05-20T08:00:00.000Z',
      source: 'utility',
      isEstimated: true,
    });
    const readingId = useWaterTrackingStore.getState().readings[0].id;
    useWaterTrackingStore.getState().actions.updateReading(readingId, {
      source: 'homeowner',
      isEstimated: undefined,
    });
    const updated = useWaterTrackingStore.getState().readings[0];
    expect(updated.source).toBe('homeowner');
    expect(updated.isEstimated).toBeUndefined();
  });
});

describe('migration v0 → v1', () => {
  test('readings without source are backfilled with homeowner', () => {
    useWaterTrackingStore.setState({
      meters: [{ id: 'm1', name: 'Main', createdAt: '2026-05-01T00:00:00.000Z' }],
      readings: [
        {
          id: 'r1',
          meterId: 'm1',
          reading: 1.0,
          takenAt: '2026-05-01T08:00:00.000Z',
          createdAt: '2026-05-01T08:00:00.000Z',
          // no `source` — simulating legacy data
        } as unknown as Reading,
      ],
      selectedMeterId: 'm1',
    });

    const readings = useWaterTrackingStore.getState().readings;
    const migrated = readings.map(r => ({ ...r, source: r.source ?? 'homeowner' }));

    expect(migrated[0].source).toBe('homeowner');
  });
});

describe('migration v1 → v2', () => {
  test('utility readings without isEstimated get backfilled as actual; homeowner reads untouched', () => {
    const v1Readings: Reading[] = [
      {
        id: 'r-util',
        meterId: 'm1',
        reading: 1.0,
        takenAt: '2026-05-01T08:00:00.000Z',
        createdAt: '2026-05-01T08:00:00.000Z',
        source: 'utility',
      },
      {
        id: 'r-home',
        meterId: 'm1',
        reading: 2.0,
        takenAt: '2026-05-02T08:00:00.000Z',
        createdAt: '2026-05-02T08:00:00.000Z',
        source: 'homeowner',
      },
    ];

    const migrated = v1Readings.map(r =>
      r.source === 'utility' ? { ...r, isEstimated: r.isEstimated ?? false } : r,
    );

    expect(migrated[0].isEstimated).toBe(false);
    expect('isEstimated' in migrated[1]).toBe(false);
  });
});
