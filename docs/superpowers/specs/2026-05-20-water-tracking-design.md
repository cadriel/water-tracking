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
  id: string;          // uuid
  name: string;        // user-supplied, e.g. "Main", "Irrigation"
  createdAt: string;   // ISO 8601
};

type Reading = {
  id: string;          // uuid
  meterId: string;     // FK -> Meter.id
  reading: number;     // decimal m³, e.g. 1234.5678
  takenAt: string;     // ISO 8601 timestamp the read was taken
  createdAt: string;   // ISO 8601 timestamp the read was entered into the app
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

Single store, composed as:

```ts
devtools(
  persist(
    immer((set, get) => ({ ... })),
    { name: "water-tracking" }
  ),
  { name: "water-tracking" }
)
```

**Shape:**

```ts
type Store = {
  meters: Meter[];
  readings: Reading[];
  selectedMeterId: string | null;

  // meter actions
  addMeter: (name: string) => string;          // returns new meter id
  renameMeter: (id: string, name: string) => void;
  deleteMeter: (id: string) => void;           // cascades to readings
  selectMeter: (id: string | null) => void;

  // reading actions
  addReading: (input: NewReadingInput) => void;
  updateReading: (id: string, patch: Partial<ReadingInput>) => void;
  deleteReading: (id: string) => void;
};

type NewReadingInput = {
  meterId: string;
  reading: number;
  takenAt: string;
};
```

`immer` lets actions write to draft state directly (`state.readings.push(r)`).
`persist` writes the entire state under `"water-tracking"` in `localStorage`.
`devtools` exposes named actions to the Redux DevTools browser extension.

When a meter is deleted, all its readings are removed in the same action. If
the deleted meter was selected, `selectedMeterId` falls back to the first
remaining meter or `null`.

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
    useStore.ts                // Zustand store + actions
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

- Zustand `persist` middleware, storage key `"water-tracking"`, default
  `localStorage` backend
- Whole store is serialised — small data volumes (hundreds of readings max
  in any realistic horizon)
- No migration framework yet; we'll add one if/when the schema changes

## Validation Rules (Summary)

| Rule | Behaviour |
| --- | --- |
| All 8 digits required | Hard block; submit disabled |
| `takenAt` not in future | Hard block; inline error |
| Reading lower than previous | Soft warning; user can confirm and save |
| Meter name required, non-empty | Hard block on meter add/rename |
| Meter name uniqueness | Not enforced; user can name them anything |

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

## Open Decisions Deferred to Implementation

- Exact MUI theme (light only is fine; we'll pick reasonable defaults)
- ID generation: `crypto.randomUUID()` (browser-native, no dep)
- Date picker library: MUI X Date Pickers (free community version)
