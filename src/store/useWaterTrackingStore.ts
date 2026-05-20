import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Meter, Reading, NewReadingInput } from '../types';

export interface WaterTrackingState {
  meters: Meter[];
  readings: Reading[];
  selectedMeterId: string | null;
}

interface WaterTrackingActions {
  actions: {
    addMeter: (name: string) => string;
    renameMeter: (id: string, name: string) => void;
    deleteMeter: (id: string) => void;
    selectMeter: (id: string | null) => void;

    addReading: (input: NewReadingInput) => void;
    updateReading: (id: string, patch: Partial<NewReadingInput>) => void;
    deleteReading: (id: string) => void;
  };
}

const name = 'water-tracking-store';

const initialState: WaterTrackingState = {
  meters: [],
  readings: [],
  selectedMeterId: null,
};

// Exported for tests and non-React subscribers only.
// Components should consume the per-slice selector hooks below.
export const useWaterTrackingStore = create<WaterTrackingState & WaterTrackingActions>()(
  devtools(
    persist(
      immer(set => ({
        ...initialState,
        actions: {
          addMeter: (meterName: string) => {
            const id = crypto.randomUUID();
            const createdAt = new Date().toISOString();
            set(state => {
              state.meters.push({ id, name: meterName, createdAt });
              if (state.selectedMeterId === null) {
                state.selectedMeterId = id;
              }
            });
            return id;
          },

          renameMeter: (id: string, meterName: string) => {
            set(state => {
              const meter = state.meters.find(m => m.id === id);
              if (meter) meter.name = meterName;
            });
          },

          deleteMeter: (id: string) => {
            set(state => {
              state.meters = state.meters.filter(m => m.id !== id);
              state.readings = state.readings.filter(r => r.meterId !== id);
              if (state.selectedMeterId === id) {
                state.selectedMeterId = state.meters[0]?.id ?? null;
              }
            });
          },

          selectMeter: (id: string | null) => {
            set(state => {
              state.selectedMeterId = id;
            });
          },

          addReading: (input: NewReadingInput) => {
            set(state => {
              state.readings.push({
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                ...input,
              });
            });
          },

          updateReading: (id: string, patch: Partial<NewReadingInput>) => {
            set(state => {
              const reading = state.readings.find(r => r.id === id);
              if (reading) Object.assign(reading, patch);
            });
          },

          deleteReading: (id: string) => {
            set(state => {
              state.readings = state.readings.filter(r => r.id !== id);
            });
          },
        },
      })),
      {
        name,
        version: 1,
        migrate: (persistedState, fromVersion) => {
          const state = persistedState as Partial<WaterTrackingState>;
          if (fromVersion < 1 && state.readings) {
            state.readings = state.readings.map(r => ({
              ...r,
              source: (r as Reading).source ?? 'homeowner',
            }));
          }
          return state as WaterTrackingState;
        },
        partialize: state => ({
          meters: state.meters,
          readings: state.readings,
          selectedMeterId: state.selectedMeterId,
        }),
      },
    ),
    { name },
  ),
);

export const useWaterTrackingMeters = () => useWaterTrackingStore(state => state.meters);
export const useWaterTrackingReadings = () => useWaterTrackingStore(state => state.readings);
export const useWaterTrackingSelectedMeterId = () =>
  useWaterTrackingStore(state => state.selectedMeterId);
export const useWaterTrackingActions = () => useWaterTrackingStore(state => state.actions);
