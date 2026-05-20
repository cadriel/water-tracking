import { beforeEach } from 'vitest';
import {
    useWaterTrackingStore,
    useWaterTrackingMeters,
    useWaterTrackingSelectedMeterId,
} from './useWaterTrackingStore';
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
