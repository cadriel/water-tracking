# Average Daily Usage — Design

**Date:** 2026-05-20
**Status:** Approved design, pending implementation plan
**Builds on:** the existing water-tracking SPA (Vite + React + TS + MUI + Zustand)

## Purpose

Add a small "Average daily usage" stats card to the meter view, showing two
side-by-side averages in litres per day:

- **All time** — over the full span between the first and latest reading
- **Last 30 days** — over the most recent 30-day window of readings

Users get an at-a-glance sense of their water consumption rate without having
to do mental math on the reading list.

## Scope

**In scope**
- Calculation helpers for both window types (`src/lib/usage.ts`)
- Unit tests covering the math and edge cases
- A `UsageStats` component that displays the two values
- Wiring into `App.tsx` so the card appears between the `AppHeader` and the
  `ReadingList` when a meter is selected

**Out of scope**
- Cost / tariff calculations
- Comparison to "typical household" benchmarks
- Per-week / per-month / custom ranges (we'll add a range selector later if
  the two fixed windows aren't enough)
- Charts or sparklines for the average over time
- Localisation of "L/day" or "litres" labels
- Persisting the stat values (always computed fresh from readings)

## File Structure

```
src/
  components/
    UsageStats.tsx              // new — stats card
  lib/
    usage.ts                    // new — average daily usage calculation
    usage.test.ts               // new — unit tests
  App.tsx                       // modify — render UsageStats above ReadingList
```

`src/lib/usage.ts` is a separate file from `src/lib/formatting.ts` because
the concerns are different: usage.ts computes values from a list of readings,
formatting.ts converts a single value to a display string. The existing
`formatReading` / `formatDelta` helpers are not touched.

## Calculation Logic

`src/lib/usage.ts` exposes two pure functions:

```ts
import type { Reading } from '../types';

/** Returns L/day across the full reading history, or null if not computable. */
export function averageDailyUsageLitres(readings: Reading[]): number | null;

/**
 * Returns L/day for the last N days, anchored at `asOf` (defaults to "now").
 * Returns null if there are fewer than 2 readings inside the window or the
 * span is zero days.
 */
export function averageDailyUsageLitresInLastNDays(
    readings: Reading[],
    days: number,
    asOf?: Date,
): number | null;
```

### Algorithm

For both functions, the steps are:

1. Filter readings to the window
   - All-time: no filter
   - Last N days: keep readings where `takenAt >= asOf - N days`
2. Sort the filtered readings by `takenAt` ascending
3. If fewer than 2 readings remain, return `null`
4. Take the earliest and latest readings in the window
5. Compute `daysBetween = (latest.takenAt - earliest.takenAt) / MS_PER_DAY`
   using millisecond differences
6. If `daysBetween === 0`, return `null` (degenerate span)
7. Return `(latest.reading - earliest.reading) * 1000 / daysBetween`

The reading values are in m³, so multiplying the delta by 1000 produces L,
and dividing by days produces L/day.

### Edge cases

| Input | Returned |
| --- | --- |
| 0 readings | `null` |
| 1 reading | `null` |
| ≥ 2 readings all on the same day | `null` |
| ≥ 2 readings spanning ≥ 1 day | the L/day value |
| Last 30 days, no readings in window | `null` |
| Last 30 days, 1 reading in window | `null` |
| Reading decreased between earliest and latest | a negative number (displayed as-is) |

The "reading decreased" case is rare — the `ReadingFormDialog` already warns
when a new reading is lower than the previous one — and we deliberately don't
special-case it. A negative average is the most honest representation of the
underlying data.

## UI Component

`src/components/UsageStats.tsx`:

```tsx
interface UsageStatsProps {
    meterId: string;
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

`StatColumn` is a small inline helper that renders the label (e.g. "All time")
above the value (`245.3 L/day`) or an em-dash plus a small caption
(`Need more readings`) when the value is `null`. It lives in the same file
since it isn't reused elsewhere.

The card returns `null` when the meter has fewer than 2 readings overall,
matching the existing `UsageChart` behaviour (the user gets the empty-state
placeholder from the chart in that case anyway).

### Formatting

Values display with one decimal place: `245.3 L/day`. We do not reuse
`formatDelta` — that helper produces a signed string in both m³ and L,
which isn't appropriate here. A small inline formatter in `UsageStats.tsx`
handles this:

```ts
function formatLitresPerDay(value: number): string {
    return `${value.toFixed(1)} L/day`;
}
```

## Wiring

`src/App.tsx` adds the import and renders `<UsageStats meterId={meterToShow} />`
between `<ReadingList ... />` and `<UsageChart ... />`. Render order top-to-
bottom: header, stats, list, chart. The stats card is the most condensed
summary, so placing it first puts the key numbers in front of the user
without scrolling.

## Tests

`src/lib/usage.test.ts` covers:

- `averageDailyUsageLitres`
  - returns `null` for an empty array
  - returns `null` for a single reading
  - returns `null` for two readings on the same day
  - returns the correct L/day for two readings exactly one day apart
  - returns the correct L/day for three readings spanning multiple days
    (the calculation uses earliest + latest, not consecutive pairs)
  - returns a negative number for a decreasing reading sequence
- `averageDailyUsageLitresInLastNDays`
  - returns `null` when no readings fall in the window
  - returns `null` when only one reading falls in the window
  - returns the correct L/day when readings span the window
  - ignores readings outside the window (older than `asOf - N days`)
  - uses the injected `asOf` to make tests deterministic

No UI tests for `UsageStats.tsx` — consistent with the rest of the project's
UI testing scope. The unit tests of `usage.ts` cover the logic; the
component is a thin presentational wrapper.

## Non-goals to be explicit about

- We will not add a 7-day or 90-day window. The "Show both" answer in
  brainstorming locked in exactly two stats; more options means more UI
  complexity for a small gain.
- We will not add a chart of "average daily usage over time". The
  `UsageChart` already shows reading-over-time; an average derivative on
  top of that is a future enhancement.
- We will not change `formatDelta` or any existing formatting helper.
