# Average Daily Usage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small "Average daily usage" stats card to the meter view showing all-time and last-30-day averages in litres per day.

**Architecture:** A new `src/lib/usage.ts` holds the pure calculation logic (unit-tested); a new `src/components/UsageStats.tsx` renders the card; `App.tsx` is wired to display it between the header and the reading list.

**Tech Stack:** TypeScript, React, MUI (no new dependencies).

**Reference spec:** `docs/superpowers/specs/2026-05-20-average-daily-usage-design.md`

---

## File Map

```
src/
  lib/
    usage.ts                    // new — averageDailyUsageLitres, averageDailyUsageLitresInLastNDays
    usage.test.ts               // new — unit tests for both
  components/
    UsageStats.tsx              // new — stats card (StatColumn helper inline)
  App.tsx                       // modify — render <UsageStats /> between header and ReadingList
```

---

### Task 1: Usage calculation helpers (TDD)

**Files:**
- Create: `src/lib/usage.test.ts`
- Create: `src/lib/usage.ts`

Two pure functions:

```ts
export function averageDailyUsageLitres(readings: Reading[]): number | null;
export function averageDailyUsageLitresInLastNDays(
    readings: Reading[],
    days: number,
    asOf?: Date,
): number | null;
```

Algorithm (for both): filter to the window if applicable, sort ascending by `takenAt`, return `null` if fewer than 2 readings or the span is zero days, otherwise `(latest.reading - earliest.reading) * 1000 / daysBetween`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/usage.test.ts`:

```ts
import {
    averageDailyUsageLitres,
    averageDailyUsageLitresInLastNDays,
} from './usage';
import type { Reading } from '../types';

function makeReading(takenAt: string, reading: number, meterId = 'm1'): Reading {
    return {
        id: `${takenAt}-${reading}`,
        meterId,
        reading,
        takenAt,
        createdAt: takenAt,
    };
}

describe('averageDailyUsageLitres', () => {
    test('returns null for an empty array', () => {
        expect(averageDailyUsageLitres([])).toBeNull();
    });

    test('returns null for a single reading', () => {
        expect(
            averageDailyUsageLitres([makeReading('2026-05-01T08:00:00.000Z', 100)]),
        ).toBeNull();
    });

    test('returns null for two readings on the same day (zero span)', () => {
        expect(
            averageDailyUsageLitres([
                makeReading('2026-05-01T08:00:00.000Z', 100),
                makeReading('2026-05-01T20:00:00.000Z', 100.5),
            ]),
        ).toBeNull();
    });

    test('returns the correct L/day for two readings exactly one day apart', () => {
        // 0.5 m³ delta over 1 day = 500 L/day
        expect(
            averageDailyUsageLitres([
                makeReading('2026-05-01T08:00:00.000Z', 100),
                makeReading('2026-05-02T08:00:00.000Z', 100.5),
            ]),
        ).toBeCloseTo(500, 5);
    });

    test('uses earliest and latest only, not consecutive pairs', () => {
        // 0.3 m³ delta over 3 days = 100 L/day
        // The middle reading is irrelevant to the all-time average.
        expect(
            averageDailyUsageLitres([
                makeReading('2026-05-01T08:00:00.000Z', 100),
                makeReading('2026-05-02T08:00:00.000Z', 100.25),
                makeReading('2026-05-04T08:00:00.000Z', 100.3),
            ]),
        ).toBeCloseTo(100, 5);
    });

    test('handles input that is not pre-sorted', () => {
        // Same as the previous test but with readings in reverse order in the array.
        expect(
            averageDailyUsageLitres([
                makeReading('2026-05-04T08:00:00.000Z', 100.3),
                makeReading('2026-05-02T08:00:00.000Z', 100.25),
                makeReading('2026-05-01T08:00:00.000Z', 100),
            ]),
        ).toBeCloseTo(100, 5);
    });

    test('returns a negative number when readings decreased', () => {
        // -0.2 m³ over 1 day = -200 L/day
        expect(
            averageDailyUsageLitres([
                makeReading('2026-05-01T08:00:00.000Z', 100.5),
                makeReading('2026-05-02T08:00:00.000Z', 100.3),
            ]),
        ).toBeCloseTo(-200, 5);
    });
});

describe('averageDailyUsageLitresInLastNDays', () => {
    const asOf = new Date('2026-05-31T12:00:00.000Z');

    test('returns null when no readings fall in the window', () => {
        // Latest reading is 60 days before asOf; window is 30 days.
        expect(
            averageDailyUsageLitresInLastNDays(
                [
                    makeReading('2026-03-30T08:00:00.000Z', 100),
                    makeReading('2026-04-01T08:00:00.000Z', 100.5),
                ],
                30,
                asOf,
            ),
        ).toBeNull();
    });

    test('returns null when only one reading falls in the window', () => {
        expect(
            averageDailyUsageLitresInLastNDays(
                [
                    makeReading('2026-03-30T08:00:00.000Z', 100),
                    makeReading('2026-05-20T08:00:00.000Z', 100.5),
                ],
                30,
                asOf,
            ),
        ).toBeNull();
    });

    test('returns L/day across the window using only in-window readings', () => {
        // Window is 2026-05-01T12:00 .. asOf.
        // The 2026-04-30 reading is OUT of window and must be ignored.
        // Earliest in-window = 2026-05-11 @ 100.5; latest = 2026-05-21 @ 100.7.
        // Delta = 0.2 m³ over 10 days = 20 L/day.
        expect(
            averageDailyUsageLitresInLastNDays(
                [
                    makeReading('2026-04-30T08:00:00.000Z', 100),
                    makeReading('2026-05-11T12:00:00.000Z', 100.5),
                    makeReading('2026-05-21T12:00:00.000Z', 100.7),
                ],
                30,
                asOf,
            ),
        ).toBeCloseTo(20, 5);
    });

    test('a reading exactly at the window boundary counts as in-window', () => {
        // asOf - 30 days = 2026-05-01T12:00:00.000Z.
        // A reading at exactly that moment counts as in-window.
        expect(
            averageDailyUsageLitresInLastNDays(
                [
                    makeReading('2026-05-01T12:00:00.000Z', 100),
                    makeReading('2026-05-31T12:00:00.000Z', 100.3),
                ],
                30,
                asOf,
            ),
        ).toBeCloseTo(10, 5);
    });

    test('defaults asOf to "now" when not provided', () => {
        // Two readings, one taken right before "now" and one a day before that.
        // We can't pin "now" exactly, so just confirm we get a non-null number
        // back when both readings are very recent.
        const now = Date.now();
        const a = new Date(now - 25 * 3_600_000).toISOString(); // 25h ago
        const b = new Date(now - 60_000).toISOString(); // 1 min ago
        const result = averageDailyUsageLitresInLastNDays(
            [makeReading(a, 100), makeReading(b, 100.1)],
            30,
        );
        expect(result).not.toBeNull();
        expect(result!).toBeGreaterThan(0);
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- src/lib/usage.test.ts
```

Expected: failures with "Cannot find module './usage'".

- [ ] **Step 3: Implement `src/lib/usage.ts`**

```ts
import type { Reading } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function averageBetween(earliest: Reading, latest: Reading): number | null {
    const daysBetween =
        (new Date(latest.takenAt).getTime() - new Date(earliest.takenAt).getTime()) /
        MS_PER_DAY;
    if (daysBetween <= 0) return null;
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
    const inWindow = readings.filter(
        r => new Date(r.takenAt).getTime() >= windowStart,
    );
    if (inWindow.length < 2) return null;
    const sorted = sortAscending(inWindow);
    return averageBetween(sorted[0], sorted[sorted.length - 1]);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test -- src/lib/usage.test.ts
```

Expected: 13 tests pass (7 in the first describe block, 5 in the second, 1 for the default-asOf case).

- [ ] **Step 5: Confirm the full suite still passes**

```bash
npm test
```

Expected: all tests pass (existing 30 + 13 new = 43).

- [ ] **Step 6: Commit**

```bash
git add src/lib/usage.ts src/lib/usage.test.ts
git commit -m "Add average daily usage calculation helpers"
```

---

### Task 2: `UsageStats` component

**Files:**
- Create: `src/components/UsageStats.tsx`

The component renders a Paper card with two stat columns ("All time" and "Last 30 days") showing L/day values. Returns `null` when the meter has fewer than 2 readings. Each column shows the value (e.g. `245.3 L/day`) or an em-dash with a small caption (`Need more readings`) when the calculation returns `null`.

- [ ] **Step 1: Create `src/components/UsageStats.tsx`**

```tsx
import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
    averageDailyUsageLitres,
    averageDailyUsageLitresInLastNDays,
} from '../lib/usage';
import { useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface UsageStatsProps {
    meterId: string;
}

function formatLitresPerDay(value: number): string {
    return `${value.toFixed(1)} L/day`;
}

interface StatColumnProps {
    label: string;
    value: number | null;
}

function StatColumn({ label, value }: StatColumnProps) {
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
                        Need more readings
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

export function UsageStats({ meterId }: UsageStatsProps) {
    const readings = useWaterTrackingReadings();

    const meterReadings = useMemo(
        () => readings.filter(r => r.meterId === meterId),
        [readings, meterId],
    );

    const allTime = useMemo(
        () => averageDailyUsageLitres(meterReadings),
        [meterReadings],
    );
    const last30Days = useMemo(
        () => averageDailyUsageLitresInLastNDays(meterReadings, 30),
        [meterReadings],
    );

    if (meterReadings.length < 2) return null;

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="overline" color="text.secondary">
                Average daily usage
            </Typography>
            <Stack direction="row" spacing={4} sx={{ mt: 1 }}>
                <StatColumn label="All time" value={allTime} />
                <StatColumn label="Last 30 days" value={last30Days} />
            </Stack>
        </Paper>
    );
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/UsageStats.tsx
git commit -m "Add UsageStats component"
```

---

### Task 3: Wire `UsageStats` into `App.tsx` + manual smoke test

**Files:**
- Modify: `src/App.tsx`

Render `<UsageStats meterId={meterToShow} />` between the `<AppHeader />` and `<ReadingList />`. The card already handles the "fewer than 2 readings" case internally by returning `null`, so no conditional logic is needed at the App level.

- [ ] **Step 1: Update `src/App.tsx`**

Open `src/App.tsx`. The current file looks like:

```tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { AppHeader } from './components/AppHeader';
import { EmptyState } from './components/EmptyState';
import { MeterManagerDialog } from './components/MeterManagerDialog';
import { ReadingList } from './components/ReadingList';
import { UsageChart } from './components/UsageChart';
import {
    useWaterTrackingMeters,
    useWaterTrackingSelectedMeterId,
} from './store/useWaterTrackingStore';

function App() {
    const meters = useWaterTrackingMeters();
    const selectedMeterId = useWaterTrackingSelectedMeterId();
    const [managerOpen, setManagerOpen] = useState(false);

    const noMeters = meters.length === 0;
    const meterToShow = selectedMeterId ?? meters[0]?.id ?? null;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppHeader onManageMeters={() => setManagerOpen(true)} />
            <Container maxWidth="md" sx={{ py: 4 }}>
                {noMeters ? (
                    <EmptyState onCreateMeter={() => setManagerOpen(true)} />
                ) : meterToShow ? (
                    <>
                        <ReadingList meterId={meterToShow} />
                        <UsageChart meterId={meterToShow} />
                    </>
                ) : null}
            </Container>
            <MeterManagerDialog open={managerOpen} onClose={() => setManagerOpen(false)} />
        </Box>
    );
}

export default App;
```

Add the `UsageStats` import and render it before `ReadingList` so the final file reads:

```tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { AppHeader } from './components/AppHeader';
import { EmptyState } from './components/EmptyState';
import { MeterManagerDialog } from './components/MeterManagerDialog';
import { ReadingList } from './components/ReadingList';
import { UsageChart } from './components/UsageChart';
import { UsageStats } from './components/UsageStats';
import {
    useWaterTrackingMeters,
    useWaterTrackingSelectedMeterId,
} from './store/useWaterTrackingStore';

function App() {
    const meters = useWaterTrackingMeters();
    const selectedMeterId = useWaterTrackingSelectedMeterId();
    const [managerOpen, setManagerOpen] = useState(false);

    const noMeters = meters.length === 0;
    const meterToShow = selectedMeterId ?? meters[0]?.id ?? null;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppHeader onManageMeters={() => setManagerOpen(true)} />
            <Container maxWidth="md" sx={{ py: 4 }}>
                {noMeters ? (
                    <EmptyState onCreateMeter={() => setManagerOpen(true)} />
                ) : meterToShow ? (
                    <>
                        <UsageStats meterId={meterToShow} />
                        <ReadingList meterId={meterToShow} />
                        <UsageChart meterId={meterToShow} />
                    </>
                ) : null}
            </Container>
            <MeterManagerDialog open={managerOpen} onClose={() => setManagerOpen(false)} />
        </Box>
    );
}

export default App;
```

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```

Expected: 43 tests pass.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Manual smoke test in the dev server**

```bash
npm run dev
```

Open `http://localhost:5173`. Confirm:

- With **0 or 1 reading** for the selected meter, the stats card is **not** rendered (just the list + chart placeholder as before).
- With **2+ readings** spanning at least one day, the stats card appears between the header and the reading list, showing the "All time" value.
- If both readings are within the last 30 days, "Last 30 days" shows the same value as "All time".
- Edit one of the readings so its date is more than 30 days ago. Reload; the "Last 30 days" column should now show `—` and "Need more readings" (because only one in-window reading remains).
- Both readings on the same day: stats card still renders, but both values show `—` (zero-day span).
- Reload the page; the stats reflect the persisted readings without flicker.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "Wire UsageStats into App layout"
```

---

## Self-Review

**Spec coverage:**
- `src/lib/usage.ts` with both functions → Task 1
- Unit tests covering empty / 1 reading / same-day / multi-day / decreasing / unsorted / window edge cases → Task 1 (test code shown in full)
- `src/components/UsageStats.tsx` with `StatColumn` helper, `formatLitresPerDay`, the "Need more readings" fallback, and the "< 2 readings → null" early return → Task 2
- Wiring in `App.tsx` between header and `ReadingList` → Task 3

All four spec areas (calculation, tests, component, wiring) are accounted for.

**Placeholder scan:** no TBDs, no "similar to Task N", no "add validation" — every step has its actual code or command.

**Type consistency:** `averageDailyUsageLitres` and `averageDailyUsageLitresInLastNDays` use the same names across tasks. `UsageStatsProps`, `StatColumnProps`, and `formatLitresPerDay` only appear in Task 2.
