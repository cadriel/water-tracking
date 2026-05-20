# Utility-Provided Readings + Chart Refresh — Design

**Date:** 2026-05-20
**Status:** Approved design, pending implementation plan
**Builds on:** the water-tracking SPA, the average-daily-usage feature

## Purpose

Tag each reading as either homeowner-entered or copied from a utility bill,
then use that tag to:

- Compute average daily usage between the two most recent utility readings
  ("Last billing cycle" stat)
- Color the chart marks by source so homeowner vs utility readings are
  visually distinct at a glance, without hovering
- Limit the chart to the last 30 days

There's no separate "billing date" entity — the utility-tagged reading is
itself the billing-date marker.

## Scope

**In scope**
- Add `source: 'homeowner' | 'utility'` to the `Reading` type with a
  schema migration via `persist`'s `version` bump
- Source selector in `ReadingFormDialog` (defaults to homeowner)
- Utility chip in `ReadingList` rows
- New `averageBetweenLastUtilityReadings()` helper + tests
- "Last billing cycle" column in `UsageStats`
- `UsageChart` filtered to the last 30 days, with permanent color-coded
  marks (theme primary for homeowner, theme secondary for utility)

**Out of scope**
- Counting / total stats for utility readings
- Per-meter default source
- A timeline / calendar-like view of utility readings
- Editing source via inline action on the list (covered by the edit dialog)
- Showing the chart's effective date range as a label

## Data Model

```ts
export interface Reading {
    id: string;
    meterId: string;
    reading: number;
    takenAt: string;
    createdAt: string;
    source: 'homeowner' | 'utility'; // NEW
}
```

The `NewReadingInput` type used by `addReading` and `updateReading`
gains the same field, with no default — the form supplies an explicit value.

### Migration

The Zustand store's `persist` middleware bumps `version` from `0` to `1`
and adds a `migrate` function that backfills `source: 'homeowner'` on every
persisted reading:

```ts
persist(
    immer(set => ({ /* … */ })),
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
        partialize: /* unchanged */,
    },
)
```

The migration is idempotent — re-running it on already-v1 data is a no-op
because `r.source` is already present.

## UI Changes

### `ReadingFormDialog`

Adds a source selector — a MUI `ToggleButtonGroup` with two `ToggleButton`s
("Homeowner" / "Utility"). The default for new readings is `'homeowner'`;
for edits, the form pre-populates from `editingReading.source`.

The toggle sits above the date picker so it's clearly part of the per-read
metadata, not part of the value entry.

The submit handler passes `source` through in the payload along with
`meterId`, `reading`, and `takenAt`.

### `ReadingList`

The "Reading" column gains a small MUI `Chip` next to the value for
utility-sourced rows. Homeowner rows show no chip (default state = no
visual noise).

```tsx
<TableCell>
    {formatReading(reading.reading)}
    {reading.source === 'utility' && (
        <Chip size="small" label="Utility" color="secondary" sx={{ ml: 1 }} />
    )}
</TableCell>
```

### `UsageStats`

Renders three stat columns: "All time", "Last 30 days", and a new
**"Last billing cycle"**. The new column uses
`averageBetweenLastUtilityReadings`. If the result is `null`, the caption
beneath the em-dash reads `Need 2 utility readings` instead of the
generic "Need more readings" — so the user knows what to do.

### `UsageChart`

Three changes bundled:

1. **30-day window**: filter readings to those with
   `takenAt >= now - 30 days` before computing the series. The chart's
   placeholder (fewer than 2 readings in window) re-uses the existing
   "Add another reading to see usage over time." message.
2. **Always-visible marks**: pass `showMark: true` on the series and don't
   suppress marks via highlight state.
3. **Color-coded marks**: each point's mark color follows its `source`.
   Implementation uses MUI X's `slots.mark` to render a small `<circle>`
   whose fill / stroke comes from the theme: `theme.palette.primary.main`
   for homeowner, `theme.palette.secondary.main` for utility. The
   connecting line itself stays a single neutral color
   (`theme.palette.text.secondary`).

The custom mark component reads the index from MUI X's mark slot props
and looks up the corresponding reading in the filtered, sorted array to
determine the source. The lookup array is passed via component closure.

## Calculation

```ts
/** Returns L/day between the two most recent utility readings, or null. */
export function averageBetweenLastUtilityReadings(
    readings: Reading[],
): number | null;
```

Steps:

1. Filter to `source === 'utility'`
2. Sort ascending by `takenAt`
3. If fewer than 2 → `null`
4. Take the last two (`prev` = sorted[len-2], `latest` = sorted[len-1])
5. Use the same `averageBetween` helper already in `usage.ts`:
   `< 1 day` span → `null`; otherwise
   `(latest.reading - prev.reading) * 1000 / daysBetween`

### Edge cases

| Input | Returned |
| --- | --- |
| 0 utility readings | `null` |
| 1 utility reading | `null` |
| 2 utility readings on the same day | `null` (span < 1 day) |
| 2 utility readings ≥ 1 day apart | the L/day value |
| 3+ utility readings | uses only the most recent two |

This matches the existing helper conventions: invisible-correctness via
input data, not silently returning misleading numbers.

## Tests

`src/lib/usage.test.ts` adds a new describe block for
`averageBetweenLastUtilityReadings` covering:

- 0 utility readings → null
- 1 utility reading → null
- 2 utility readings on the same day → null
- 2 utility readings 5 days apart → correct L/day
- 3 utility readings, uses only the last two (the older ones don't change
  the answer)
- Homeowner readings interleaved with utility readings: only the utility
  pair determines the value
- Input array not pre-sorted

No tests for the UI components (matches existing testing scope). The
chart's custom mark slot is intentionally untested — visual verification
in the dev server is sufficient.

## Non-goals to be explicit about

- We will not move the chart's date-range to be user-selectable. The 30-day
  window is fixed for now.
- We will not add a "utility-only" filter to the readings list. The chip
  is enough.
- We will not change the existing two stats columns. "All time" and
  "Last 30 days" still use all readings regardless of source.
- We will not display a count of utility vs homeowner readings.
