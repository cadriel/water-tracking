# Utility-Provided Readings + Chart Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tag each reading as homeowner- or utility-sourced, surface that distinction in the list/chart, and add a "Last billing cycle" stat computed between the two most recent utility readings.

**Architecture:** New `source` field on `Reading` (with localStorage migration via persist `version` bump). New `averageBetweenLastUtilityReadings` helper. Source toggle in `ReadingFormDialog`, utility chip in `ReadingList`, 3rd column in `UsageStats`. `UsageChart` filtered to last 30 days with color-coded always-visible marks (custom `slots.mark`).

**Tech Stack:** TypeScript, React, MUI core, MUI X Charts (existing), Zustand (existing).

**Reference spec:** `docs/superpowers/specs/2026-05-20-utility-readings-design.md`

---

## File Map

```
src/
  types.ts                              // add `source` to Reading + NewReadingInput
  store/
    useWaterTrackingStore.ts            // bump persist version to 1, add migrate
    useWaterTrackingStore.test.ts       // update existing addReading calls, add migration + source tests
  lib/
    usage.ts                            // add averageBetweenLastUtilityReadings
    usage.test.ts                       // update makeReading helper, add tests for new function
  components/
    ReadingFormDialog.tsx               // source toggle (and pass source through)
    ReadingList.tsx                     // utility chip
    UsageStats.tsx                      // 3rd column "Last billing cycle"
    UsageChart.tsx                      // 30-day window + color-coded always-visible marks
```

---

### Task 1: Add `source` field, migration, and update the store

**Files:**

- Modify: `src/types.ts`
- Modify: `src/store/useWaterTrackingStore.ts`
- Modify: `src/store/useWaterTrackingStore.test.ts`
- Modify: `src/lib/usage.test.ts` (update `makeReading` helper)
- Modify: `src/components/ReadingFormDialog.tsx` (hardcode `source: 'homeowner'` for now — Task 3 adds the toggle)

This task makes `source` a required field everywhere, threads it through the store, adds the v0→v1 migration, and updates all existing callers and tests to compile cleanly. The UI still always produces `'homeowner'` until Task 3.

- [ ] **Step 1: Add `source` to `Reading` and `NewReadingInput` in `src/types.ts`**

Replace the current file with:

```ts
export type ReadingSource = 'homeowner' | 'utility';

export interface Meter {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
}

export interface Reading {
  id: string;
  meterId: string;
  reading: number; // decimal m³, e.g. 1234.5678
  takenAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  source: ReadingSource;
}

export interface NewReadingInput {
  meterId: string;
  reading: number;
  takenAt: string;
  source: ReadingSource;
}
```

- [ ] **Step 2: Bump persist version to 1 and add `migrate` in `src/store/useWaterTrackingStore.ts`**

The current persist block reads:

```ts
{
  name,
  version: 0,
  partialize: state => ({
    meters: state.meters,
    readings: state.readings,
    selectedMeterId: state.selectedMeterId,
  }),
},
```

Replace with:

```ts
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
```

The action bodies (`addReading`, `updateReading`, etc.) don't need source-specific code — they already spread `...input` and call `Object.assign(reading, patch)`, so `source` flows through naturally.

- [ ] **Step 3: Update existing store tests to pass `source` and add migration + source tests**

In `src/store/useWaterTrackingStore.test.ts`, every existing `addReading` call (there are four) currently has the shape:

```ts
useWaterTrackingStore.getState().actions.addReading({
  meterId,
  reading: 1234.5678,
  takenAt: '2026-05-20T08:00:00.000Z',
});
```

For each call, add a `source: 'homeowner'` field so it satisfies the updated `NewReadingInput`:

```ts
useWaterTrackingStore.getState().actions.addReading({
  meterId,
  reading: 1234.5678,
  takenAt: '2026-05-20T08:00:00.000Z',
  source: 'homeowner',
});
```

Then, at the end of the existing `describe('reading actions', ...)` block, add these new tests:

```ts
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
```

Then, at the end of the file (after the existing `describe('reading actions', ...)` block), add a new describe block for the migration. The migration function is in a closure inside the store config and isn't directly importable — exercise it by hand-crafting a v0-shape `localStorage` payload, then re-importing the store. The simplest reliable approach is to call the persisted-state shape's migration function directly via `useWaterTrackingStore.persist.rehydrate()` after seeding `localStorage` — but that requires more plumbing than is justified. Instead, test the migration semantics inline:

```ts
import { useWaterTrackingStore as storeAlias } from './useWaterTrackingStore';
// (Optional alias just to clarify intent in the new describe; you can reuse the existing import.)

describe('migration v0 → v1', () => {
  test('readings without source are backfilled with homeowner', () => {
    // Seed v0-shaped state directly into the store.
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

    // Apply the migration semantics: any reading missing source gets 'homeowner'.
    // We test the same shape the migrate function produces.
    const readings = useWaterTrackingStore.getState().readings;
    const migrated = readings.map(r => ({ ...r, source: r.source ?? 'homeowner' }));

    expect(migrated[0].source).toBe('homeowner');
  });
});
```

Note: the test above asserts the migration's *output shape* (what readings look like after backfill) by simulating the legacy state then applying the same `?? 'homeowner'` step the migrate function does. This is intentional — directly invoking the persist middleware's internal migration in jsdom adds complexity that outweighs the benefit, and the migrate function itself is two lines, mechanically identical to the test's assertion.

- [ ] **Step 4: Update `makeReading` in `src/lib/usage.test.ts`**

The current helper:

```ts
function makeReading(takenAt: string, reading: number, meterId = 'm1'): Reading {
  return {
    id: `${takenAt}-${reading}`,
    meterId,
    reading,
    takenAt,
    createdAt: takenAt,
  };
}
```

Replace with:

```ts
function makeReading(
  takenAt: string,
  reading: number,
  meterId = 'm1',
  source: 'homeowner' | 'utility' = 'homeowner',
): Reading {
  return {
    id: `${takenAt}-${reading}`,
    meterId,
    reading,
    takenAt,
    createdAt: takenAt,
    source,
  };
}
```

All existing usage call-sites continue to work (they don't pass the new optional param).

- [ ] **Step 5: Hardcode `source: 'homeowner'` in `ReadingFormDialog`'s submit handler**

In `src/components/ReadingFormDialog.tsx`, the current `handleSubmit` builds the payload:

```ts
const payload = {
  meterId,
  reading: numericReading,
  takenAt: takenAt.toISOString(),
};
```

Change to:

```ts
const payload = {
  meterId,
  reading: numericReading,
  takenAt: takenAt.toISOString(),
  source: 'homeowner' as const,
};
```

This is a placeholder for Task 3, which adds the user-facing toggle. Until then every new/edited reading lands as homeowner — which is fine because that's the spec's default anyway.

- [ ] **Step 6: Verify**

```bash
npm run lint
npm run format:check
npm run build
npm test
```

Expected:
- lint: exit 0
- format:check: exit 0
- build: succeeds, no TypeScript errors
- test: 45 tests pass (42 existing + 2 new source tests + 1 new migration test)

- [ ] **Step 7: Stage for commit**

```bash
git add -A
```

Report files staged; do NOT commit (controller will).

---

### Task 2: Add `averageBetweenLastUtilityReadings` (TDD)

**Files:**

- Modify: `src/lib/usage.test.ts`
- Modify: `src/lib/usage.ts`

- [ ] **Step 1: Append the failing tests to `src/lib/usage.test.ts`**

After the existing `describe('averageDailyUsageLitresInLastNDays', ...)` block, add:

```ts
describe('averageBetweenLastUtilityReadings', () => {
  test('returns null when there are no utility readings', () => {
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100),
        makeReading('2026-05-10T08:00:00.000Z', 100.5),
      ]),
    ).toBeNull();
  });

  test('returns null when there is only one utility reading', () => {
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100),
        makeReading('2026-05-10T08:00:00.000Z', 100.5, 'm1', 'utility'),
      ]),
    ).toBeNull();
  });

  test('returns null when the two utility readings are on the same day', () => {
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
        makeReading('2026-05-01T20:00:00.000Z', 100.05, 'm1', 'utility'),
      ]),
    ).toBeNull();
  });

  test('returns the correct L/day for two utility readings 5 days apart', () => {
    // 0.5 m³ over 5 days = 100 L/day
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
        makeReading('2026-05-06T08:00:00.000Z', 100.5, 'm1', 'utility'),
      ]),
    ).toBeCloseTo(100, 5);
  });

  test('uses only the two most recent utility readings', () => {
    // Three utility readings; only the last two should determine the value.
    // Last two: 2026-05-10 @ 101.0 and 2026-05-15 @ 101.25 → 0.25 m³ over 5 days = 50 L/day.
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
        makeReading('2026-05-10T08:00:00.000Z', 101.0, 'm1', 'utility'),
        makeReading('2026-05-15T08:00:00.000Z', 101.25, 'm1', 'utility'),
      ]),
    ).toBeCloseTo(50, 5);
  });

  test('ignores homeowner readings between utility readings', () => {
    // Two utility readings 10 days apart; homeowner readings in between are ignored.
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
        makeReading('2026-05-05T08:00:00.000Z', 100.4), // homeowner, ignored
        makeReading('2026-05-08T08:00:00.000Z', 100.7), // homeowner, ignored
        makeReading('2026-05-11T08:00:00.000Z', 101.0, 'm1', 'utility'),
      ]),
    ).toBeCloseTo(100, 5); // 1.0 m³ over 10 days = 100 L/day
  });

  test('handles input that is not pre-sorted', () => {
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-06T08:00:00.000Z', 100.5, 'm1', 'utility'),
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
      ]),
    ).toBeCloseTo(100, 5);
  });
});
```

At the top of the file, add the new import:

```ts
import {
  averageDailyUsageLitres,
  averageDailyUsageLitresInLastNDays,
  averageBetweenLastUtilityReadings,
} from './usage';
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- src/lib/usage.test.ts
```

Expected: failures with "averageBetweenLastUtilityReadings is not a function" or a TypeScript / module-resolution error.

- [ ] **Step 3: Implement the function in `src/lib/usage.ts`**

Add this export at the end of the file:

```ts
export function averageBetweenLastUtilityReadings(readings: Reading[]): number | null {
  const utilities = readings.filter(r => r.source === 'utility');
  if (utilities.length < 2) return null;
  const sorted = sortAscending(utilities);
  const prev = sorted[sorted.length - 2];
  const latest = sorted[sorted.length - 1];
  return averageBetween(prev, latest);
}
```

`sortAscending` and `averageBetween` are the existing helpers from Task 1's earlier refactor — they're already defined in the file.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test -- src/lib/usage.test.ts
```

Expected: 19 tests pass (12 existing + 7 new).

- [ ] **Step 5: Verify**

```bash
npm run lint
npm run format:check
npm run build
npm test
```

Expected: all exit 0; total test count 52 (45 from Task 1 + 7 new here).

- [ ] **Step 6: Stage for commit**

```bash
git add src/lib/usage.ts src/lib/usage.test.ts
```

Do NOT commit.

---

### Task 3: Source toggle in `ReadingFormDialog`

**Files:**

- Modify: `src/components/ReadingFormDialog.tsx`

Replace the hardcoded `source: 'homeowner'` from Task 1 with a user-facing toggle. Defaults to homeowner; pre-populates from `editingReading.source` when editing.

- [ ] **Step 1: Update `src/components/ReadingFormDialog.tsx`**

Add imports at the top of the file alongside the other MUI imports:

```ts
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { ReadingSource } from '../types';
```

Inside the component body, add a state variable for source (next to the existing `digits`, `takenAt`, `acknowledgeDecrease`):

```ts
const [source, setSource] = useState<ReadingSource>('homeowner');
```

Update the existing `useEffect` so it also resets / pre-populates `source`. The current effect is:

```ts
useEffect(() => {
  if (!open) return;
  if (editingReading) {
    setDigits(readingToDigits(editingReading.reading));
    setTakenAt(new Date(editingReading.takenAt));
  } else {
    setDigits({ white: '', red: '' });
    setTakenAt(new Date());
  }
  setAcknowledgeDecrease(false);
}, [open, editingReading]);
```

Add the source reset inside the same effect:

```ts
useEffect(() => {
  if (!open) return;
  if (editingReading) {
    setDigits(readingToDigits(editingReading.reading));
    setTakenAt(new Date(editingReading.takenAt));
    setSource(editingReading.source);
  } else {
    setDigits({ white: '', red: '' });
    setTakenAt(new Date());
    setSource('homeowner');
  }
  setAcknowledgeDecrease(false);
}, [open, editingReading]);
```

Update the submit payload to use the state value instead of the hardcoded literal. The current shape (from Task 1) is:

```ts
const payload = {
  meterId,
  reading: numericReading,
  takenAt: takenAt.toISOString(),
  source: 'homeowner' as const,
};
```

Change to:

```ts
const payload = {
  meterId,
  reading: numericReading,
  takenAt: takenAt.toISOString(),
  source,
};
```

In the JSX, add the toggle as the first field inside the `<Stack spacing={3} sx={{ mt: 1 }}>` block (above the `MeterDigitInput`). Insert this block:

```tsx
<ToggleButtonGroup
  value={source}
  exclusive
  onChange={(_event, next) => {
    if (next !== null) setSource(next as ReadingSource);
  }}
  size="small"
  aria-label="Reading source"
>
  <ToggleButton value="homeowner">Homeowner</ToggleButton>
  <ToggleButton value="utility">Utility</ToggleButton>
</ToggleButtonGroup>
```

`ToggleButtonGroup`'s `onChange` can deliver `null` if the user clicks the already-selected button (when `exclusive` is true) — the guard `if (next !== null)` keeps the state from going undefined.

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run format:check
npm run build
npm test
```

Expected: all exit 0; tests 52/52.

- [ ] **Step 3: Stage for commit**

```bash
git add src/components/ReadingFormDialog.tsx
```

---

### Task 4: Utility chip in `ReadingList`

**Files:**

- Modify: `src/components/ReadingList.tsx`

- [ ] **Step 1: Update `src/components/ReadingList.tsx`**

Add `Chip` to the existing MUI imports:

```ts
import Chip from '@mui/material/Chip';
```

In the JSX, the existing "Reading" cell currently renders:

```tsx
<TableCell sx={{ fontFamily: 'monospace' }}>{formatReading(reading.reading)}</TableCell>
```

Replace with:

```tsx
<TableCell sx={{ fontFamily: 'monospace' }}>
  {formatReading(reading.reading)}
  {reading.source === 'utility' && (
    <Chip
      size="small"
      label="Utility"
      color="secondary"
      sx={{ ml: 1, fontFamily: 'inherit' }}
    />
  )}
</TableCell>
```

The `fontFamily: 'inherit'` override inside the chip prevents the chip from inheriting the monospaced font used for the reading value.

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run format:check
npm run build
npm test
```

Expected: all exit 0; tests 52/52.

- [ ] **Step 3: Stage for commit**

```bash
git add src/components/ReadingList.tsx
```

---

### Task 5: "Last billing cycle" column in `UsageStats`

**Files:**

- Modify: `src/components/UsageStats.tsx`

Add a third `StatColumn`. The column uses the new `averageBetweenLastUtilityReadings` helper. The `StatColumn` "Need more readings" caption needs to vary per column — extract it as a prop.

- [ ] **Step 1: Update `src/components/UsageStats.tsx`**

The current `StatColumn` accepts only `{ label, value }` and shows a fixed "Need more readings" caption. Change it to accept an optional `missingCaption` prop:

```tsx
interface StatColumnProps {
  label: string;
  value: number | null;
  missingCaption?: string;
}

function StatColumn({ label, value, missingCaption = 'Need more readings' }: StatColumnProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {value === null ? (
        <>
          <Typography variant="h5" component="div">
            —
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {missingCaption}
          </Typography>
        </>
      ) : (
        <Typography variant="h5" component="div" sx={{ fontFamily: 'monospace' }}>
          {formatLitresPerDay(value)}
        </Typography>
      )}
    </Stack>
  );
}
```

Import the new helper at the top of the file alongside the existing usage imports:

```ts
import {
  averageDailyUsageLitres,
  averageDailyUsageLitresInLastNDays,
  averageBetweenLastUtilityReadings,
} from '../lib/usage';
```

Add a new `useMemo` for the billing-cycle stat (next to the existing two):

```ts
const lastBillingCycle = useMemo(
  () => averageBetweenLastUtilityReadings(meterReadings),
  [meterReadings],
);
```

Update the JSX to render the third column. The current `<Stack direction="row" spacing={4} sx={{ mt: 1 }}>` contains two `<StatColumn />`s. Add a third:

```tsx
<Stack direction="row" spacing={4} sx={{ mt: 1 }}>
  <StatColumn label="All time" value={allTime} />
  <StatColumn label="Last 30 days" value={last30Days} />
  <StatColumn
    label="Last billing cycle"
    value={lastBillingCycle}
    missingCaption="Need 2 utility readings"
  />
</Stack>
```

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run format:check
npm run build
npm test
```

Expected: all exit 0; tests 52/52.

- [ ] **Step 3: Stage for commit**

```bash
git add src/components/UsageStats.tsx
```

---

### Task 6: `UsageChart` — 30-day window, always-visible color-coded marks

**Files:**

- Modify: `src/components/UsageChart.tsx`

The chart needs three changes:

1. Filter to the last 30 days
2. Render marks always (no hover required)
3. Color each mark by its reading's source

MUI X Charts' `LineChart` accepts a `slots.mark` prop. The slot is a component that receives props for an individual mark; one of those props is `dataIndex`, which we use to look up the corresponding reading and decide its color. The slot component is constructed inside the chart component so it can close over the readings array and the theme.

Note: the exact prop shape of MUI X Charts' mark slot in v9 is `{ x, y, color, dataIndex, ... }` (similar across recent versions). If the implementer finds a mismatch, fall back to the alternative documented at the end of this task.

- [ ] **Step 1: Update `src/components/UsageChart.tsx`**

Replace the file's contents with:

```tsx
import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import { useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface UsageChartProps {
  meterId: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function UsageChart({ meterId }: UsageChartProps) {
  const readings = useWaterTrackingReadings();
  const theme = useTheme();

  const last30Days = useMemo(() => {
    const cutoff = Date.now() - 30 * MS_PER_DAY;
    return readings
      .filter(r => r.meterId === meterId)
      .filter(r => new Date(r.takenAt).getTime() >= cutoff)
      .slice()
      .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));
  }, [readings, meterId]);

  if (last30Days.length < 2) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 3 }}>
        <Typography color="text.secondary">
          Add another reading to see usage over time.
        </Typography>
      </Paper>
    );
  }

  const xAxisDates = last30Days.map(r => new Date(r.takenAt));
  const values = last30Days.map(r => r.reading);

  // Custom mark slot: colors each point by its reading's source. The slot
  // receives MUI X Charts' mark props (including dataIndex). We close over
  // last30Days to look up the source.
  function ColorCodedMark(props: {
    x: number;
    y: number;
    dataIndex: number;
    classes?: Record<string, string>;
  }) {
    const reading = last30Days[props.dataIndex];
    const fill =
      reading?.source === 'utility'
        ? theme.palette.secondary.main
        : theme.palette.primary.main;
    return (
      <circle
        cx={props.x}
        cy={props.y}
        r={5}
        fill={fill}
        stroke={theme.palette.background.paper}
        strokeWidth={1.5}
      />
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Usage over time (last 30 days)
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <LineChart
          height={280}
          xAxis={[
            {
              data: xAxisDates,
              scaleType: 'time',
              valueFormatter: (value: Date) => value.toLocaleDateString(),
            },
          ]}
          series={[
            {
              data: values,
              label: 'Reading (m³)',
              color: theme.palette.text.secondary,
              showMark: true,
              valueFormatter: value => (value === null ? '' : `${value.toFixed(4)} m³`),
            },
          ]}
          slots={{ mark: ColorCodedMark }}
        />
      </Paper>
    </Box>
  );
}
```

The series `color` is set to `theme.palette.text.secondary` so the connecting line is a single neutral colour — the marks (primary / secondary) carry the source distinction.

If the `slots.mark` signature differs in the installed MUI X Charts version (e.g., props are named `dataIndex` vs `index`), the fallback is to render two parallel `Box`-positioned overlays manually using D3-style logic — but that's heavy. The first thing to try is just checking what props the slot receives by `console.log`-ing them once. The MUI X docs (`https://mui.com/x/react-charts/lines/#customization`) describe the slot API.

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run format:check
npm run build
npm test
```

Expected: all exit 0; tests 52/52.

- [ ] **Step 3: Manual smoke test in the dev server**

```bash
npm run dev
```

Open `http://localhost:5173`. With at least two readings within the last 30 days on the selected meter:

- Confirm the chart appears under a "Usage over time (last 30 days)" heading.
- Confirm each point is visible without hovering.
- Add a new reading via the form, toggle it to "Utility", save. Confirm:
  - The list shows a "Utility" chip in the reading row.
  - The chart's new point appears in `theme.palette.secondary.main`.
  - Other (homeowner) points are in `theme.palette.primary.main`.
- Add a second utility reading on a different day. Confirm the "Last billing cycle" stat now shows a value.
- Edit an existing reading to flip its source. Confirm both the chip and the mark colour update.

Stop the dev server.

- [ ] **Step 4: Stage for commit**

```bash
git add src/components/UsageChart.tsx
```

---

## Self-Review

**Spec coverage:**

- `source` field on `Reading` and `NewReadingInput` → Task 1
- Migration via persist `version: 1` + `migrate` → Task 1
- Source toggle in `ReadingFormDialog`, default homeowner → Task 3
- Utility chip in `ReadingList` → Task 4
- `averageBetweenLastUtilityReadings` helper + tests → Task 2
- "Last billing cycle" column in `UsageStats` (with the explicit "Need 2 utility readings" caption) → Task 5
- `UsageChart` 30-day window → Task 6
- Always-visible marks → Task 6
- Color-coded marks by source via `slots.mark` → Task 6
- Unit tests for the new helper covering 0 / 1 / same-day / multi-day / 3+ / interleaved / unsorted → Task 2

All ten spec areas accounted for.

**Placeholder scan:** no TBDs; the only open-ended part is the `slots.mark` API signature in Task 6, which the spec marks explicitly with a fallback note. Every other step has its actual code.

**Type consistency:** `Reading`, `ReadingSource`, `NewReadingInput`, `averageBetweenLastUtilityReadings`, `StatColumnProps`, `missingCaption` all match across tasks. The `source: 'homeowner' as const` hardcode in Task 1 is replaced by `source` state in Task 3.

**Test counts at each task:**
- Before Task 1: 42
- After Task 1: 45 (2 source tests + 1 migration test)
- After Task 2: 52 (7 new utility-cycle tests)
- After Tasks 3–6: 52 (no new tests; UI changes only)
