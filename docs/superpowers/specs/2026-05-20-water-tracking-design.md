# Water Meter Tracking SPA — Design

**Date:** 2026-05-20
**Status:** Approved design, pending implementation plan
**Stack:** React + Vite + TypeScript, MUI, Zustand (with devtools, persist, immer middleware), MUI X Charts

## Purpose

A small, single-page React app for recording water-meter readings at home in New Zealand. Readings are entered in the same format as a physical mechanical water meter: 4 white digits representing whole cubic metres, followed by 4 red digits representing the fractional cubic-metre portion (the "decimal" digits).

Data is persisted client-side in `localStorage` only — no backend, no auth. The app supports one or more named meters; each meter has its own list of readings.

## Scope

**In scope**

- Create, edit, delete meters (each with a user-supplied name)
- Create, edit, delete readings on the selected meter
- Each reading has a value (4 white + 4 red digits) plus a date and time (defaulting to "now")
- View readings sorted by `takenAt`
- Show usage delta between consecutive readings (in m³ and L)
- Show a simple cumulative-usage chart for the selected meter
- Persist all state to `localStorage`

**Out of scope (for now)**

- Authentication, sync between devices, multi-user
- Export / import (CSV, JSON) — may be added later
- Tariffs, cost calculation, billing periods
- Mobile-app packaging (PWA, Capacitor, etc.)
- Server-side anything

## Data Model

```ts
type Meter = {
  id: string; // uuid
  name: string; // user-supplied, e.g. "Main", "Irrigation"
  createdAt: string; // ISO 8601
};

type Reading = {
  id: string; // uuid
  meterId: string; // FK -> Meter.id
  reading: number; // decimal m³, e.g. 1234.5678
  takenAt: string; // ISO 8601 timestamp the read was taken
  createdAt: string; // ISO 8601 timestamp the read was entered into the app
};
```

The reading value is stored as a single `number` (decimal m³) rather than as
two integer fields. Reasoning:

- Math for usage deltas and charts becomes trivial (`a.reading - b.reading`)
- Sorting and comparison work directly
- White / red digits are a presentation concern, derived on the fly:
  - `white = Math.floor(reading)` (zero-padded to 4 digits)
  - `red = Math.round((reading - white) * 10000)` (zero-padded to 4 digits)

A reading of `0001.0000` is therefore stored as `1.0`, displayed as `0001`
white + `0000` red. The total in litres is `reading * 1000`.

## Zustand Store

Single store at `src/store/useWaterTrackingStore.ts`, following the project's
existing store-formatting conventions:

- **State and actions split into two interfaces**, with actions nested under
  an `actions: {}` object on the store
- A `name` constant declared once and reused for both `persist`'s storage key
  and `devtools`' store label
- An `initialState` constant declared separately and spread into the
  `immer` initialiser
- `persist` configured with `version: 0` and an explicit `partialize` listing
  exactly which fields survive reloads
- Per-slice selector hooks exported alongside the store (one per state field
  plus a single `useWaterTrackingActions` hook)
- The `create<T>()(...)` curry form for correct middleware type inference

**Shape:**

```ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface WaterTrackingState {
  meters: Meter[];
  readings: Reading[];
  selectedMeterId: string | null;
}

interface WaterTrackingActions {
  actions: {
    // meter actions
    addMeter: (name: string) => string; // returns new meter id
    renameMeter: (id: string, name: string) => void;
    deleteMeter: (id: string) => void; // cascades to readings
    selectMeter: (id: string | null) => void;

    // reading actions
    addReading: (input: NewReadingInput) => void;
    updateReading: (id: string, patch: Partial<NewReadingInput>) => void;
    deleteReading: (id: string) => void;
  };
}

type NewReadingInput = {
  meterId: string;
  reading: number;
  takenAt: string;
};

const name = 'water-tracking-store';

const initialState: WaterTrackingState = {
  meters: [],
  readings: [],
  selectedMeterId: null,
};

const useWaterTrackingStore = create<WaterTrackingState & WaterTrackingActions>()(
  devtools(
    persist(
      immer(set => ({
        ...initialState,
        actions: {
          // ...implementations using set(state => { state.x = ... })
        },
      })),
      {
        name,
        version: 0,
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

// Selector hooks — one per slice + actions
export const useWaterTrackingMeters = () => useWaterTrackingStore(state => state.meters);
export const useWaterTrackingReadings = () => useWaterTrackingStore(state => state.readings);
export const useWaterTrackingSelectedMeterId = () =>
  useWaterTrackingStore(state => state.selectedMeterId);
export const useWaterTrackingActions = () => useWaterTrackingStore(state => state.actions);
```

Components consume the store via the per-slice selector hooks, never by
subscribing to the whole store. Actions are pulled via
`useWaterTrackingActions()` (stable reference — never causes re-renders since
the `actions` object is created once at store init).

**Derived data** (e.g. readings filtered to the selected meter, sorted by
`takenAt`) is computed in components or small helper functions in
`src/lib/`, not stored in the store. The store holds only canonical state.

**Cascade behaviour:** `deleteMeter(id)` removes the meter and every reading
with `meterId === id` in the same `set` call. If the deleted meter was the
selected one, `selectedMeterId` falls back to the first remaining meter's
`id` or `null`.

**`partialize`:** all three state fields are persisted. Listed explicitly
(rather than persisting everything) so future ephemeral UI state added to
the store doesn't accidentally leak into `localStorage`.

## UI Structure

```
src/
  components/
    AppHeader.tsx              // title + meter selector + manage button
    MeterManagerDialog.tsx     // add / rename / delete meters
    EmptyState.tsx             // "Create your first meter" prompt
    ReadingList.tsx            // table of readings for selected meter
    ReadingFormDialog.tsx      // create + edit reading
    MeterDigitInput.tsx        // 8-digit white+red input control
    UsageChart.tsx             // MUI X line chart for selected meter
  store/
    useWaterTrackingStore.ts   // Zustand store + selector hooks
  lib/
    formatting.ts              // splitDigits, formatReading, formatDelta
  types.ts                     // Meter, Reading, input types
  theme.ts                     // MUI theme
  App.tsx
  main.tsx
```

## Component Behaviour

### `AppHeader`

- Title ("Water Tracking")
- Meter `<Select>` showing the active meter name
- "Manage meters" button → opens `MeterManagerDialog`
- Hidden / replaced by empty-state CTA when no meters exist yet

### `MeterManagerDialog`

- Lists existing meters with rename + delete affordances
- "Add meter" field with name input + add button
- Delete asks for confirmation (cascades to readings)

### `EmptyState`

- Rendered when `meters.length === 0`
- Single CTA: "Create your first meter" → opens `MeterManagerDialog` in add mode

### `ReadingList`

- Table columns: Date/time | Reading (`1234.5678 m³`) | Usage since previous (`+0.0123 m³ / +12.3 L`) | Actions (edit / delete)
- Sorted by `takenAt` descending by default
- Delete asks for confirmation
- Edit opens `ReadingFormDialog` pre-populated
- Empty list shows: "No readings yet. Add your first reading."

### `ReadingFormDialog`

- Fields: `MeterDigitInput`, date picker, time picker
- Date+time default to "now" for new readings; pre-populated for edits
- Submit button disabled until all 8 digits are entered
- Validation:
  - All 8 digits required
  - `takenAt` cannot be in the future
  - If the new value is lower than the most recent prior reading (by `takenAt`),
    show a warning ("Reading decreased since previous — water meters usually
    only go up. Save anyway?") but allow saving on confirm

### `MeterDigitInput`

- 4 white digit boxes followed by 4 red digit boxes, rendered to look like a
  mechanical meter readout (light text on dark, then white text on red)
- Each box accepts one digit `[0-9]`, auto-advances focus on input,
  backspace moves focus back
- Paste support: pasting an 8-digit string fills all boxes; non-digits stripped
- Exposes value as `{ white: string, red: string }` to the form, which converts
  to a single decimal on submit

### `UsageChart`

- Line chart (MUI X `LineChart`) of `reading` over `takenAt` for the selected
  meter, ordered ascending in time
- Hidden / replaced with a placeholder when fewer than 2 readings exist
- One series; no secondary axes; tooltip shows `m³` and converted `L`

## Persistence

- Zustand `persist` middleware, storage key `"water-tracking-store"`,
  default `localStorage` backend
- `partialize` explicitly lists `meters`, `readings`, and `selectedMeterId`
  as the persisted fields (small data volumes — hundreds of readings max in
  any realistic horizon)
- `version: 0` is set now so we have a hook for a `migrate` function later
  if the schema changes

## Validation Rules (Summary)

| Rule                           | Behaviour                                 |
| ------------------------------ | ----------------------------------------- |
| All 8 digits required          | Hard block; submit disabled               |
| `takenAt` not in future        | Hard block; inline error                  |
| Reading lower than previous    | Soft warning; user can confirm and save   |
| Meter name required, non-empty | Hard block on meter add/rename            |
| Meter name uniqueness          | Not enforced; user can name them anything |

## Initial / Empty States

- First launch: no meters → `EmptyState` with CTA to create one
- Meter selected, no readings → `ReadingList` shows empty message; chart shows
  placeholder
- Meter selected, 1 reading → list shows it with no delta; chart shows
  placeholder ("Add another reading to see usage over time")

## Non-goals to be explicit about

- No tests beyond what a sensible developer would add for the digit input and
  the store's delta/cascade logic. Heavy testing is out of scope for a personal
  utility at this stage.
- No CI/CD, no deployment pipeline. Local `npm run dev` and `npm run build`
  are the supported workflows.
- No accessibility audit. We rely on MUI's defaults (which are reasonable) and
  ensure the digit input is keyboard-navigable, but we won't perform a full
  WCAG review.

## Theming

- Use MUI's `CssVarsProvider` with `extendTheme` so light and dark palettes
  are both defined and switchable via CSS variables (no full re-render on
  theme change)
- `defaultMode: 'system'` so the app follows the OS-level preference by
  default. The browser's `prefers-color-scheme` media query drives it
- Include `<InitColorSchemeScript />` in `index.html` (or before the root
  render) to prevent the wrong-theme flash on first paint
- No in-app theme toggle for now (system preference is authoritative)
- Default palettes are fine; we won't customise primary/secondary colours
- The `MeterDigitInput` is the one component that needs explicit dark/light
  treatment — the white-digit block uses theme-aware light surface +
  dark text, and the red-digit block stays red in both modes (matching a
  physical meter's appearance)

## Other Decisions

- **IDs:** `crypto.randomUUID()` (browser-native, no extra dependency)
- **Date / time pickers:** MUI X Date Pickers (free community version) with
  a date-fns adapter
