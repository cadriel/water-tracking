# Water Tracking SPA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React SPA that records water-meter readings (4 white + 4 red digits in cubic metres) for one or more named meters, with create/edit/delete, usage deltas, a simple chart, and localStorage persistence.

**Architecture:** Single-page Vite + React + TypeScript app. Zustand store (with `devtools`, `persist`, `immer` middleware) holds meters, readings, and the selected meter. MUI provides UI primitives, MUI X provides date/time pickers and a line chart. The app follows the OS light/dark preference via MUI's `CssVarsProvider`.

**Tech Stack:** React 18, Vite, TypeScript, MUI (`@mui/material`, `@mui/x-date-pickers`, `@mui/x-charts`), Zustand 4, date-fns, Vitest + React Testing Library for the parts that get tested.

**Testing scope:** Per the design spec, automated tests cover only the units where logic errors are non-obvious — formatting helpers, the Zustand store (action behaviour + cascade delete), and the `MeterDigitInput` component. The remaining UI components are verified manually in the dev server.

**Reference spec:** `docs/superpowers/specs/2026-05-20-water-tracking-design.md`

---

## File Map

```
water-tracking/
  package.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  index.html
  .gitignore
  src/
    main.tsx                            // app entry, providers
    App.tsx                             // top-level layout, dialogs
    theme.ts                            // MUI CssVarsProvider theme
    types.ts                            // Meter, Reading, NewReadingInput
    vite-env.d.ts                       // Vite client types
    test/setup.ts                       // jest-dom + RTL setup
    lib/
      formatting.ts                     // splitDigits, formatReading, formatDelta
      formatting.test.ts
    store/
      useWaterTrackingStore.ts          // Zustand store + selector hooks
      useWaterTrackingStore.test.ts
    components/
      AppHeader.tsx
      MeterManagerDialog.tsx
      EmptyState.tsx
      ReadingList.tsx
      ReadingFormDialog.tsx
      MeterDigitInput.tsx
      MeterDigitInput.test.tsx
      UsageChart.tsx
```

---

### Task 1: Scaffold the Vite + React + TypeScript project

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "water-tracking",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.10"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Water Tracking</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `.gitignore`**

```gitignore
node_modules
dist
dist-ssr
*.local
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

- [ ] **Step 7: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 8: Create `src/App.tsx`**

```tsx
function App() {
  return <h1>Water Tracking</h1>;
}

export default App;
```

- [ ] **Step 9: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 10: Install dependencies and verify dev server**

```bash
npm install
npm run dev
```

Expected: dev server starts at `http://localhost:5173`, page shows "Water Tracking". Stop the server with `Ctrl+C` after verifying.

- [ ] **Step 11: Verify type-check passes**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "Scaffold Vite + React + TypeScript project"
```

---

### Task 2: Install Vitest, React Testing Library, and a smoke test

**Files:**

- Modify: `package.json`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx` (temporary smoke test; deleted at end of task)

- [ ] **Step 1: Install testing dependencies**

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 3: Create `src/App.test.tsx` to verify the test runner works**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app title', () => {
  render(<App />);
  expect(screen.getByText('Water Tracking')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the test**

```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 5: Delete the temporary smoke test**

```bash
rm src/App.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "Add Vitest and React Testing Library"
```

---

### Task 3: Install MUI and configure system-aware theming

**Files:**

- Modify: `package.json` (via npm install)
- Create: `src/theme.ts`
- Modify: `src/main.tsx`
- Modify: `index.html`
- Modify: `src/App.tsx`

- [ ] **Step 1: Install MUI dependencies**

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled @mui/x-date-pickers @mui/x-charts date-fns@^3
```

- [ ] **Step 2: Create `src/theme.ts`**

```ts
import { extendTheme } from '@mui/material/styles';

export const theme = extendTheme({
  colorSchemes: {
    light: true,
    dark: true,
  },
});
```

- [ ] **Step 3: Update `src/main.tsx` to wrap the app in providers**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  getInitColorSchemeScript,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import App from './App';
import { theme } from './theme';

// Note: getInitColorSchemeScript output is injected before hydration to
// avoid the "wrong theme on first paint" flash.
const initScript = getInitColorSchemeScript({ defaultMode: 'system' });
if (initScript) {
  const script = document.createElement('script');
  script.textContent = String(initScript.props.children);
  document.head.insertBefore(script, document.head.firstChild);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssVarsProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <App />
      </LocalizationProvider>
    </CssVarsProvider>
  </StrictMode>,
);
```

- [ ] **Step 4: Update `src/App.tsx` to render a basic MUI layout**

```tsx
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function App() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Water Tracking
        </Typography>
        <Typography color="text.secondary">No meters yet.</Typography>
      </Box>
    </Container>
  );
}

export default App;
```

- [ ] **Step 5: Verify in the dev server**

```bash
npm run dev
```

Open `http://localhost:5173`. Confirm:

- Title renders in the MUI typography style
- Background colour follows OS preference (toggle OS dark mode if possible to verify)

Stop the dev server.

- [ ] **Step 6: Verify type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "Add MUI and system-aware theming via CssVarsProvider"
```

---

### Task 4: Define core types

**Files:**

- Create: `src/types.ts`

- [ ] **Step 1: Create `src/types.ts`**

```ts
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
}

export interface NewReadingInput {
  meterId: string;
  reading: number;
  takenAt: string;
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "Add core domain types"
```

---

### Task 5: Formatting helpers (TDD)

**Files:**

- Create: `src/lib/formatting.test.ts`
- Create: `src/lib/formatting.ts`

`splitDigits(reading)` returns the white (4 whole-m³ digits) and red (4 fractional digits) string representations. `formatReading(reading)` returns the canonical display string `"1234.5678 m³"`. `formatDelta(deltaM3)` returns a signed string `"+0.0123 m³ / +12.3 L"`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/formatting.test.ts`:

```ts
import { splitDigits, formatReading, formatDelta } from './formatting';

describe('splitDigits', () => {
  test('splits a whole-and-fraction reading into 4+4 digit strings', () => {
    expect(splitDigits(1234.5678)).toEqual({ white: '1234', red: '5678' });
  });

  test('zero-pads small whites', () => {
    expect(splitDigits(7.0001)).toEqual({ white: '0007', red: '0001' });
  });

  test('zero-pads small reds', () => {
    expect(splitDigits(1234.0001)).toEqual({ white: '1234', red: '0001' });
  });

  test('handles a clean integer reading', () => {
    expect(splitDigits(42)).toEqual({ white: '0042', red: '0000' });
  });

  test('rounds the fractional portion to 4 digits', () => {
    // 0.12345 has 5 decimal digits — should round to 1235
    expect(splitDigits(1.12345)).toEqual({ white: '0001', red: '1235' });
  });
});

describe('formatReading', () => {
  test('formats with 4 decimal places and m³ suffix', () => {
    expect(formatReading(1234.5678)).toBe('1234.5678 m³');
  });

  test('pads short readings', () => {
    expect(formatReading(7)).toBe('0007.0000 m³');
  });
});

describe('formatDelta', () => {
  test('formats a positive delta in m³ and L', () => {
    expect(formatDelta(0.0123)).toBe('+0.0123 m³ / +12.3 L');
  });

  test('formats a negative delta', () => {
    expect(formatDelta(-0.005)).toBe('-0.0050 m³ / -5.0 L');
  });

  test('formats a zero delta', () => {
    expect(formatDelta(0)).toBe('+0.0000 m³ / +0.0 L');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- src/lib/formatting.test.ts
```

Expected: failures with "Cannot find module './formatting'".

- [ ] **Step 3: Implement `src/lib/formatting.ts`**

```ts
export interface DigitParts {
  white: string;
  red: string;
}

export function splitDigits(reading: number): DigitParts {
  // Use the rounded total to avoid floating-point splits going off-by-one
  // (e.g. 1.12345 → red 1235, not 1234).
  const totalTenThousandths = Math.round(reading * 10000);
  const whole = Math.floor(totalTenThousandths / 10000);
  const fraction = totalTenThousandths - whole * 10000;
  return {
    white: String(whole).padStart(4, '0'),
    red: String(fraction).padStart(4, '0'),
  };
}

export function formatReading(reading: number): string {
  const { white, red } = splitDigits(reading);
  return `${white}.${red} m³`;
}

export function formatDelta(deltaM3: number): string {
  const sign = deltaM3 >= 0 ? '+' : '-';
  const absM3 = Math.abs(deltaM3);
  const absL = absM3 * 1000;
  return `${sign}${absM3.toFixed(4)} m³ / ${sign}${absL.toFixed(1)} L`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test -- src/lib/formatting.test.ts
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "Add formatting helpers for reading display and deltas"
```

---

### Task 6: Zustand store — state + meter actions (TDD)

**Files:**

- Modify: `package.json` (via npm install)
- Create: `src/store/useWaterTrackingStore.test.ts`
- Create: `src/store/useWaterTrackingStore.ts`

- [ ] **Step 1: Install Zustand and immer**

```bash
npm install zustand immer
```

- [ ] **Step 2: Write the failing tests**

Create `src/store/useWaterTrackingStore.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
npm test -- src/store
```

Expected: failures with "Cannot find module './useWaterTrackingStore'".

- [ ] **Step 4: Implement `src/store/useWaterTrackingStore.ts` (meter actions only — reading actions added in Task 7)**

```ts
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

          renameMeter: (id, meterName) => {
            set(state => {
              const meter = state.meters.find(m => m.id === id);
              if (meter) meter.name = meterName;
            });
          },

          deleteMeter: id => {
            set(state => {
              state.meters = state.meters.filter(m => m.id !== id);
              state.readings = state.readings.filter(r => r.meterId !== id);
              if (state.selectedMeterId === id) {
                state.selectedMeterId = state.meters[0]?.id ?? null;
              }
            });
          },

          selectMeter: id => {
            set(state => {
              state.selectedMeterId = id;
            });
          },

          addReading: () => {
            // Implemented in Task 7
          },

          updateReading: () => {
            // Implemented in Task 7
          },

          deleteReading: () => {
            // Implemented in Task 7
          },
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

export const useWaterTrackingMeters = () => useWaterTrackingStore(state => state.meters);
export const useWaterTrackingReadings = () => useWaterTrackingStore(state => state.readings);
export const useWaterTrackingSelectedMeterId = () =>
  useWaterTrackingStore(state => state.selectedMeterId);
export const useWaterTrackingActions = () => useWaterTrackingStore(state => state.actions);
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm test -- src/store
```

Expected: 9 tests pass.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "Add Zustand store with meter actions"
```

---

### Task 7: Add reading actions to the store (TDD)

**Files:**

- Modify: `src/store/useWaterTrackingStore.test.ts`
- Modify: `src/store/useWaterTrackingStore.ts`

- [ ] **Step 1: Append reading-action tests to `src/store/useWaterTrackingStore.test.ts`**

Add after the existing `describe('meter actions', ...)` block:

```ts
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
    });
    useWaterTrackingStore.getState().actions.addReading({
      meterId: otherId,
      reading: 2.0,
      takenAt: '2026-05-20T08:00:00.000Z',
    });
    useWaterTrackingStore.getState().actions.deleteMeter(meterId);
    const remaining = useWaterTrackingStore.getState().readings;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].meterId).toBe(otherId);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- src/store
```

Expected: 4 new failures (the existing 9 meter-action tests still pass).

- [ ] **Step 3: Replace the stub reading actions in `src/store/useWaterTrackingStore.ts`**

Replace the three stub action entries (`addReading`, `updateReading`, `deleteReading`) with:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test -- src/store
```

Expected: 13 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "Add reading actions to Zustand store"
```

---

### Task 8: `MeterDigitInput` component (TDD)

**Files:**

- Create: `src/components/MeterDigitInput.test.tsx`
- Create: `src/components/MeterDigitInput.tsx`

The component renders 8 single-digit text fields in two coloured groups (white, then red). Each box accepts `[0-9]`, auto-advances focus on input, and moves focus backwards on `Backspace` when empty. Pasting an 8-digit string into any box fills all 8 boxes.

The component exposes its value as a `{ white: string; red: string }` pair via an `onChange` callback. Each string is exactly 4 characters wide; empty positions are represented by an empty string in the position, so the parent can detect an incomplete entry.

- [ ] **Step 1: Write the failing tests**

Create `src/components/MeterDigitInput.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MeterDigitInput } from './MeterDigitInput';

function renderComponent(props: Partial<React.ComponentProps<typeof MeterDigitInput>> = {}) {
  const handleChange = vi.fn();
  render(<MeterDigitInput value={{ white: '', red: '' }} onChange={handleChange} {...props} />);
  return { handleChange };
}

test('renders 8 digit boxes', () => {
  renderComponent();
  expect(screen.getAllByRole('textbox')).toHaveLength(8);
});

test('typing into the first box fills it and advances focus', async () => {
  const user = userEvent.setup();
  const { handleChange } = renderComponent();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.keyboard('5');
  expect(handleChange).toHaveBeenLastCalledWith({ white: '5', red: '' });
});

test('typing 8 digits in sequence builds up the full value', async () => {
  const user = userEvent.setup();
  const { handleChange } = renderComponent();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.keyboard('12345678');
  expect(handleChange).toHaveBeenLastCalledWith({ white: '1234', red: '5678' });
});

test('non-digit characters are ignored', async () => {
  const user = userEvent.setup();
  const { handleChange } = renderComponent();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.keyboard('a');
  expect(handleChange).not.toHaveBeenCalled();
});

test('pasting 8 digits fills every box', async () => {
  const user = userEvent.setup();
  const { handleChange } = renderComponent();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.paste('12345678');
  expect(handleChange).toHaveBeenLastCalledWith({ white: '1234', red: '5678' });
});

test('pasting a non-digit-containing string strips the non-digits', async () => {
  const user = userEvent.setup();
  const { handleChange } = renderComponent();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.paste('12 34.56 78');
  expect(handleChange).toHaveBeenLastCalledWith({ white: '1234', red: '5678' });
});

test('Backspace on an empty box moves focus to the previous box', async () => {
  const user = userEvent.setup();
  renderComponent({ value: { white: '12', red: '' } });
  const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
  inputs[2].focus();
  await user.keyboard('{Backspace}');
  expect(document.activeElement).toBe(inputs[1]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- src/components/MeterDigitInput
```

Expected: failures with "Cannot find module './MeterDigitInput'".

- [ ] **Step 3: Implement `src/components/MeterDigitInput.tsx`**

```tsx
import { useRef } from 'react';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';

export interface DigitValue {
  white: string;
  red: string;
}

interface MeterDigitInputProps {
  value: DigitValue;
  onChange: (next: DigitValue) => void;
}

const DigitBox = styled(InputBase, {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'white' | 'red' }>(({ theme, tone }) => ({
  width: 32,
  height: 44,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 4,
  backgroundColor: tone === 'white' ? theme.palette.background.paper : theme.palette.error.main,
  color: tone === 'white' ? theme.palette.text.primary : theme.palette.common.white,
  '& input': {
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: '1.25rem',
    padding: 0,
  },
}));

const TOTAL_DIGITS = 8;
const WHITE_DIGITS = 4;

function joinDigits(value: DigitValue): string {
  return (value.white + value.red).padEnd(TOTAL_DIGITS, ' ').slice(0, TOTAL_DIGITS);
}

function splitDigits(joined: string): DigitValue {
  const trimmed = joined.replace(/\s+$/, '');
  return {
    white: trimmed.slice(0, WHITE_DIGITS),
    red: trimmed.slice(WHITE_DIGITS, TOTAL_DIGITS),
  };
}

export function MeterDigitInput({ value, onChange }: MeterDigitInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const joined = joinDigits(value);

  function setDigitAt(index: number, char: string) {
    const next = joined.split('');
    next[index] = char;
    // Trim trailing spaces so the value object only reports what the user entered.
    const compact = next.join('').replace(/\s+$/, '');
    onChange(splitDigits(compact));
  }

  function handleChange(index: number) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const digit = raw.replace(/\D/g, '').slice(-1);
      if (!digit) return;
      setDigitAt(index, digit);
      const nextInput = inputs.current[index + 1];
      if (nextInput) nextInput.focus();
    };
  }

  function handleKeyDown(index: number) {
    return (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace') {
        const currentChar = joined[index];
        if (!currentChar || currentChar === ' ') {
          const prev = inputs.current[index - 1];
          if (prev) {
            event.preventDefault();
            prev.focus();
          }
        } else {
          setDigitAt(index, ' ');
        }
      }
    };
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, TOTAL_DIGITS);
    if (!digits) return;
    event.preventDefault();
    onChange(splitDigits(digits));
    const nextIndex = Math.min(digits.length, TOTAL_DIGITS - 1);
    inputs.current[nextIndex]?.focus();
  }

  function renderBox(index: number) {
    const tone: 'white' | 'red' = index < WHITE_DIGITS ? 'white' : 'red';
    const char = joined[index];
    return (
      <DigitBox
        key={index}
        tone={tone}
        inputProps={{
          inputMode: 'numeric',
          maxLength: 1,
          'aria-label': `${tone} digit ${(index % WHITE_DIGITS) + 1}`,
        }}
        inputRef={(el: HTMLInputElement | null) => {
          inputs.current[index] = el;
        }}
        value={char === ' ' ? '' : (char ?? '')}
        onChange={handleChange(index)}
        onKeyDown={handleKeyDown(index)}
        onPaste={handlePaste}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {Array.from({ length: WHITE_DIGITS }, (_, i) => renderBox(i))}
      <Box sx={{ width: 8 }} />
      {Array.from({ length: WHITE_DIGITS }, (_, i) => renderBox(WHITE_DIGITS + i))}
    </Box>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test -- src/components/MeterDigitInput
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/MeterDigitInput.tsx src/components/MeterDigitInput.test.tsx
git commit -m "Add MeterDigitInput component"
```

---

### Task 9: `EmptyState` component

**Files:**

- Create: `src/components/EmptyState.tsx`

- [ ] **Step 1: Create `src/components/EmptyState.tsx`**

```tsx
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

interface EmptyStateProps {
  onCreateMeter: () => void;
}

export function EmptyState({ onCreateMeter }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        py: 8,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5">No meters yet</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
        Add your first water meter to start recording readings.
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateMeter}>
        Create your first meter
      </Button>
    </Box>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/EmptyState.tsx
git commit -m "Add EmptyState component"
```

---

### Task 10: `MeterManagerDialog` component

**Files:**

- Create: `src/components/MeterManagerDialog.tsx`

The dialog lists all meters with rename + delete buttons and offers an "Add meter" row at the bottom. Rename happens inline (a meter row toggles to an editable text field). Delete asks `window.confirm` first.

- [ ] **Step 1: Create `src/components/MeterManagerDialog.tsx`**

```tsx
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useWaterTrackingMeters, useWaterTrackingActions } from '../store/useWaterTrackingStore';

interface MeterManagerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function MeterManagerDialog({ open, onClose }: MeterManagerDialogProps) {
  const meters = useWaterTrackingMeters();
  const { addMeter, renameMeter, deleteMeter } = useWaterTrackingActions();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  function startEditing(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
  }

  function commitEditing() {
    if (editingId && editingName.trim()) {
      renameMeter(editingId, editingName.trim());
    }
    cancelEditing();
  }

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addMeter(trimmed);
    setNewName('');
  }

  function handleDelete(id: string, meterName: string) {
    if (window.confirm(`Delete meter "${meterName}" and all its readings?`)) {
      deleteMeter(id);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage meters</DialogTitle>
      <DialogContent dividers>
        <List dense disablePadding>
          {meters.map(meter => (
            <ListItem
              key={meter.id}
              secondaryAction={
                editingId === meter.id ? (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton edge="end" onClick={commitEditing} aria-label="Save name">
                      <CheckIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={cancelEditing} aria-label="Cancel">
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      edge="end"
                      onClick={() => startEditing(meter.id, meter.name)}
                      aria-label="Rename"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(meter.id, meter.name)}
                      aria-label="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                )
              }
            >
              {editingId === meter.id ? (
                <TextField
                  size="small"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEditing();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  autoFocus
                  fullWidth
                />
              ) : (
                <ListItemText primary={meter.name} />
              )}
            </ListItem>
          ))}
        </List>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <TextField
            size="small"
            label="New meter name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
            }}
            fullWidth
          />
          <Button variant="contained" onClick={handleAdd} disabled={!newName.trim()}>
            Add
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/MeterManagerDialog.tsx
git commit -m "Add MeterManagerDialog component"
```

---

### Task 11: `AppHeader` component

**Files:**

- Create: `src/components/AppHeader.tsx`

- [ ] **Step 1: Create `src/components/AppHeader.tsx`**

```tsx
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  useWaterTrackingMeters,
  useWaterTrackingSelectedMeterId,
  useWaterTrackingActions,
} from '../store/useWaterTrackingStore';

interface AppHeaderProps {
  onManageMeters: () => void;
}

export function AppHeader({ onManageMeters }: AppHeaderProps) {
  const meters = useWaterTrackingMeters();
  const selectedMeterId = useWaterTrackingSelectedMeterId();
  const { selectMeter } = useWaterTrackingActions();

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Water Tracking
        </Typography>
        {meters.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="meter-select-label">Meter</InputLabel>
            <Select
              labelId="meter-select-label"
              label="Meter"
              value={selectedMeterId ?? ''}
              onChange={e => selectMeter(e.target.value || null)}
            >
              {meters.map(meter => (
                <MenuItem key={meter.id} value={meter.id}>
                  {meter.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Button color="inherit" startIcon={<SettingsIcon />} onClick={onManageMeters}>
          Meters
        </Button>
      </Toolbar>
    </AppBar>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppHeader.tsx
git commit -m "Add AppHeader component"
```

---

### Task 12: `ReadingFormDialog` component

**Files:**

- Create: `src/components/ReadingFormDialog.tsx`

The dialog creates a new reading or edits an existing one. It contains the `MeterDigitInput` plus a `DateTimePicker`. Submit is disabled until all 8 digits are present. If the new value is lower than the most recent prior reading for the same meter, the form shows a warning and requires a second confirmation.

- [ ] **Step 1: Create `src/components/ReadingFormDialog.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { MeterDigitInput, type DigitValue } from './MeterDigitInput';
import type { Reading } from '../types';
import { useWaterTrackingActions, useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface ReadingFormDialogProps {
  open: boolean;
  onClose: () => void;
  meterId: string;
  editingReading: Reading | null;
}

function readingToDigits(reading: number): DigitValue {
  const total = Math.round(reading * 10000);
  const whole = Math.floor(total / 10000);
  const fraction = total - whole * 10000;
  return {
    white: String(whole).padStart(4, '0'),
    red: String(fraction).padStart(4, '0'),
  };
}

function digitsToReading(value: DigitValue): number | null {
  if (value.white.length !== 4 || value.red.length !== 4) return null;
  return Number(value.white) + Number(value.red) / 10000;
}

export function ReadingFormDialog({
  open,
  onClose,
  meterId,
  editingReading,
}: ReadingFormDialogProps) {
  const { addReading, updateReading } = useWaterTrackingActions();
  const readings = useWaterTrackingReadings();

  const [digits, setDigits] = useState<DigitValue>({ white: '', red: '' });
  const [takenAt, setTakenAt] = useState<Date | null>(new Date());
  const [acknowledgeDecrease, setAcknowledgeDecrease] = useState(false);

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

  const numericReading = digitsToReading(digits);

  const previousReading = useMemo(() => {
    if (!takenAt) return null;
    const takenAtIso = takenAt.toISOString();
    const prior = readings
      .filter(r => r.meterId === meterId && r.id !== editingReading?.id)
      .filter(r => r.takenAt < takenAtIso)
      .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
    return prior[0] ?? null;
  }, [readings, meterId, takenAt, editingReading]);

  const isFuture = takenAt ? takenAt.getTime() > Date.now() : false;
  const decreased =
    numericReading !== null && previousReading !== null && numericReading < previousReading.reading;

  const canSubmit =
    numericReading !== null && takenAt !== null && !isFuture && (!decreased || acknowledgeDecrease);

  function handleSubmit() {
    if (!canSubmit || numericReading === null || !takenAt) return;
    const payload = {
      meterId,
      reading: numericReading,
      takenAt: takenAt.toISOString(),
    };
    if (editingReading) {
      updateReading(editingReading.id, payload);
    } else {
      addReading(payload);
    }
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editingReading ? 'Edit reading' : 'New reading'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <div>
            <MeterDigitInput value={digits} onChange={setDigits} />
            <FormHelperText>4 white digits (m³), then 4 red digits (decimal)</FormHelperText>
          </div>
          <DateTimePicker
            label="Date and time"
            value={takenAt}
            onChange={setTakenAt}
            disableFuture
          />
          {isFuture && <Alert severity="error">Date cannot be in the future.</Alert>}
          {decreased && (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setAcknowledgeDecrease(true)}
                  disabled={acknowledgeDecrease}
                >
                  {acknowledgeDecrease ? 'Acknowledged' : 'Save anyway'}
                </Button>
              }
            >
              This reading is lower than the previous one ({previousReading?.reading.toFixed(4)}{' '}
              m³). Water meters usually only go up.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {editingReading ? 'Save changes' : 'Add reading'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ReadingFormDialog.tsx
git commit -m "Add ReadingFormDialog component"
```

---

### Task 13: `ReadingList` component

**Files:**

- Create: `src/components/ReadingList.tsx`

The list shows all readings for the currently-selected meter, sorted newest-first, with a "Usage since previous" column showing the delta against the previous-in-time reading. Empty state and the "Add reading" CTA live here.

- [ ] **Step 1: Create `src/components/ReadingList.tsx`**

```tsx
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { ReadingFormDialog } from './ReadingFormDialog';
import { formatDelta, formatReading } from '../lib/formatting';
import type { Reading } from '../types';
import { useWaterTrackingActions, useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface ReadingListProps {
  meterId: string;
}

interface DisplayRow {
  reading: Reading;
  delta: number | null;
}

export function ReadingList({ meterId }: ReadingListProps) {
  const readings = useWaterTrackingReadings();
  const { deleteReading } = useWaterTrackingActions();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reading | null>(null);

  const rows = useMemo<DisplayRow[]>(() => {
    const sortedAsc = readings
      .filter(r => r.meterId === meterId)
      .slice()
      .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));

    const withDeltas: DisplayRow[] = sortedAsc.map((reading, index) => ({
      reading,
      delta: index === 0 ? null : reading.reading - sortedAsc[index - 1].reading,
    }));

    return withDeltas.reverse(); // newest first
  }, [readings, meterId]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(reading: Reading) {
    setEditing(reading);
    setFormOpen(true);
  }

  function handleDelete(reading: Reading) {
    if (window.confirm('Delete this reading?')) {
      deleteReading(reading.id);
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Readings</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
          Add reading
        </Button>
      </Stack>
      {rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No readings yet. Add your first reading.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date / time</TableCell>
                <TableCell>Reading</TableCell>
                <TableCell>Usage since previous</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ reading, delta }) => (
                <TableRow key={reading.id}>
                  <TableCell>{format(new Date(reading.takenAt), 'dd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {formatReading(reading.reading)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {delta === null ? '—' : formatDelta(delta)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(reading)} aria-label="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(reading)}
                      aria-label="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <ReadingFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        meterId={meterId}
        editingReading={editing}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ReadingList.tsx
git commit -m "Add ReadingList component with usage deltas"
```

---

### Task 14: `UsageChart` component

**Files:**

- Create: `src/components/UsageChart.tsx`

- [ ] **Step 1: Create `src/components/UsageChart.tsx`**

```tsx
import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts/LineChart';
import { useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface UsageChartProps {
  meterId: string;
}

export function UsageChart({ meterId }: UsageChartProps) {
  const readings = useWaterTrackingReadings();

  const series = useMemo(() => {
    const sorted = readings
      .filter(r => r.meterId === meterId)
      .slice()
      .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));
    const xAxis = sorted.map(r => new Date(r.takenAt));
    const values = sorted.map(r => r.reading);
    return { xAxis, values };
  }, [readings, meterId]);

  if (series.values.length < 2) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 3 }}>
        <Typography color="text.secondary">Add another reading to see usage over time.</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Usage over time
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <LineChart
          height={280}
          xAxis={[
            {
              data: series.xAxis,
              scaleType: 'time',
              valueFormatter: (value: Date) => value.toLocaleDateString(),
            },
          ]}
          series={[
            {
              data: series.values,
              label: 'Reading (m³)',
              valueFormatter: value => (value === null ? '' : `${value.toFixed(4)} m³`),
            },
          ]}
        />
      </Paper>
    </Box>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/UsageChart.tsx
git commit -m "Add UsageChart component"
```

---

### Task 15: Wire everything together in `App.tsx`

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` with the full layout**

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

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (formatting helpers, store, digit input).

- [ ] **Step 3: Run the build**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Run the dev server and exercise the app manually**

```bash
npm run dev
```

In the browser at `http://localhost:5173`:

- Empty state shows on first load; click "Create your first meter"
- Add a meter named "Main"; close the dialog
- Reading list shows the empty-list message; chart shows the "Add another reading" placeholder
- Click "Add reading", enter `1234.5678`, leave date as now, click "Add reading"
- The reading appears in the table with `—` for usage
- Add a second reading taken later with a higher value; verify the delta column shows the correct `+N.NNNN m³ / +NNN.N L`
- Add a second reading taken later with a _lower_ value; verify the warning appears and submit is disabled until "Save anyway" is clicked
- Edit an existing reading; verify the value and date pre-populate correctly
- Delete a reading; verify the confirmation prompt
- Open "Meters", rename "Main" to "House"; verify the header dropdown updates
- Add a second meter, switch between them via the header dropdown
- Reload the page; verify everything is persisted
- Toggle OS dark mode (System Preferences); verify the app follows it

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "Wire app shell together"
```

---

## Self-Review

**Spec coverage:**

- Data model (Meter, Reading) → Task 4
- Zustand store with devtools + persist + immer, conventions matching the example → Tasks 6, 7
- 4 white + 4 red digit input → Task 8
- Create / edit / delete readings with date+time → Tasks 7, 12, 13
- Usage delta column → Task 13 + Task 5 helpers
- Usage chart → Task 14
- Multiple named meters, meter selector, manage dialog → Tasks 10, 11
- Empty state → Task 9
- System-default theme (light + dark) → Task 3
- localStorage persistence with `version: 0` + `partialize` → Task 6
- MUI X Date Pickers + date-fns → Task 3 (provider) + Task 12 (usage)
- crypto.randomUUID for IDs → Tasks 6, 7

All spec sections accounted for.

**No placeholders, no "similar to Task N" hand-waves, all code shown inline.** Tasks 6 and 7 do split the store across two commits (meter actions, then reading actions) — Task 6 includes stub bodies for the reading actions so the file type-checks between tasks, and Task 7 replaces them with the real implementations.

**Type consistency:** `NewReadingInput`, `WaterTrackingState`, `WaterTrackingActions`, `useWaterTrackingActions`, `MeterDigitInput`, `DigitValue` are used identically across all tasks that reference them.
