import { beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ReadingList } from '../ReadingList';
import { useWaterTrackingStore } from '../../store/useWaterTrackingStore';
import { READINGS_PAGE_SIZE } from '../../constants';

function seedReadings(meterId: string, count: number) {
  const { addReading } = useWaterTrackingStore.getState().actions;
  for (let i = 0; i < count; i += 1) {
    const day = String(i + 1).padStart(2, '0');
    addReading({
      meterId,
      reading: 1300 + i,
      takenAt: `2026-05-${day}T08:00:00.000Z`,
      source: 'homeowner',
    });
  }
}

function dataRows() {
  return screen.getAllByRole('row').slice(1); // drop header
}

function renderList(meterId: string) {
  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ReadingList meterId={meterId} />
    </LocalizationProvider>,
  );
}

function seedMeter(): string {
  return useWaterTrackingStore.getState().actions.addMeter('Main');
}

beforeEach(() => {
  localStorage.clear();
  useWaterTrackingStore.setState({ meters: [], readings: [], selectedMeterId: null });
  vi.restoreAllMocks();
});

test('shows an empty state when there are no readings for the meter', () => {
  const meterId = seedMeter();
  renderList(meterId);
  expect(screen.getByText(/no readings recorded/i)).toBeInTheDocument();
});

test('renders readings newest-first with deltas relative to the previous one', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  addReading({
    meterId,
    reading: 1300.0,
    takenAt: '2026-05-18T08:00:00.000Z',
    source: 'homeowner',
  });
  addReading({
    meterId,
    reading: 1300.5,
    takenAt: '2026-05-19T08:00:00.000Z',
    source: 'homeowner',
  });
  addReading({
    meterId,
    reading: 1301.5,
    takenAt: '2026-05-20T08:00:00.000Z',
    source: 'homeowner',
  });

  renderList(meterId);

  const rows = screen.getAllByRole('row').slice(1); // drop header row
  expect(rows).toHaveLength(3);
  expect(within(rows[0]).getByText('1301.5000 m³')).toBeInTheDocument();
  expect(within(rows[1]).getByText('1300.5000 m³')).toBeInTheDocument();
  expect(within(rows[2]).getByText('1300.0000 m³')).toBeInTheDocument();

  // Top row delta = 1301.5 - 1300.5 = +1.0; oldest row has no delta.
  expect(within(rows[0]).getByText(/\+1\.0000\s*m³/)).toBeInTheDocument();
  expect(within(rows[2]).getByText('——')).toBeInTheDocument();
});

test('renders the Utility and Estimated badges only for estimated utility reads', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  addReading({
    meterId,
    reading: 1300,
    takenAt: '2026-05-18T08:00:00.000Z',
    source: 'homeowner',
  });
  addReading({
    meterId,
    reading: 1305,
    takenAt: '2026-05-19T08:00:00.000Z',
    source: 'utility',
    isEstimated: false,
  });
  addReading({
    meterId,
    reading: 1310,
    takenAt: '2026-05-20T08:00:00.000Z',
    source: 'utility',
    isEstimated: true,
  });

  renderList(meterId);

  // Two utility reads → two "Utility" badges. One estimated → one "Estimated" badge.
  expect(screen.getAllByText('Utility')).toHaveLength(2);
  expect(screen.getAllByText('Estimated')).toHaveLength(1);
});

test('deleting a reading prompts confirm and removes it when accepted', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  const meterId = seedMeter();
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 1300,
    takenAt: '2026-05-18T08:00:00.000Z',
    source: 'homeowner',
  });

  renderList(meterId);
  await user.click(screen.getByRole('button', { name: /delete/i }));

  expect(useWaterTrackingStore.getState().readings).toHaveLength(0);
});

test('cancelling the delete confirm leaves the reading in place', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(false);

  const meterId = seedMeter();
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 1300,
    takenAt: '2026-05-18T08:00:00.000Z',
    source: 'homeowner',
  });

  renderList(meterId);
  await user.click(screen.getByRole('button', { name: /delete/i }));

  expect(useWaterTrackingStore.getState().readings).toHaveLength(1);
});

test('shows only the most recent page worth of readings by default', () => {
  const meterId = seedMeter();
  seedReadings(meterId, READINGS_PAGE_SIZE + 3); // 8 total

  renderList(meterId);

  expect(dataRows()).toHaveLength(READINGS_PAGE_SIZE);
  // Newest first: reading value 1307 (1300 + 7) is on top.
  expect(within(dataRows()[0]).getByText('1307.0000 m³')).toBeInTheDocument();
  expect(screen.getByText(/Showing 1–5 of 8/)).toBeInTheDocument();
});

test('pagination is rendered but disabled when there are no more readings than fit on one page', () => {
  const meterId = seedMeter();
  seedReadings(meterId, READINGS_PAGE_SIZE);

  renderList(meterId);

  // Pagination always renders; its page buttons are disabled.
  const nav = screen.getByRole('navigation');
  const pageButton = within(nav).getByRole('button', { name: /page 1/i });
  expect(pageButton).toBeDisabled();
  expect(screen.getByText(/Showing 1–5 of 5/)).toBeInTheDocument();
});

test('navigating to page 2 reveals the older readings', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  seedReadings(meterId, READINGS_PAGE_SIZE + 3); // 8 total → 2 pages

  renderList(meterId);
  await user.click(screen.getByRole('button', { name: /Go to page 2/i }));

  expect(dataRows()).toHaveLength(3);
  // Page 2 in desc order = the 3 oldest. Oldest = 1300.
  expect(within(dataRows()[2]).getByText('1300.0000 m³')).toBeInTheDocument();
  expect(screen.getByText(/Showing 6–8 of 8/)).toBeInTheDocument();
});

test('clicking the When header flips sort order and resets to page 1', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  seedReadings(meterId, READINGS_PAGE_SIZE + 3); // 8 total

  renderList(meterId);
  // Go to page 2 first so we can verify the reset.
  await user.click(screen.getByRole('button', { name: /Go to page 2/i }));
  expect(screen.getByText(/Showing 6–8 of 8/)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Toggle sort by date/i }));

  // Now ascending, page 1: oldest 5 readings, top row = 1300.
  expect(within(dataRows()[0]).getByText('1300.0000 m³')).toBeInTheDocument();
  expect(screen.getByText(/Showing 1–5 of 8/)).toBeInTheDocument();
});

test('deleting the only reading on the last page clamps back to the new last page', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  const meterId = seedMeter();
  seedReadings(meterId, READINGS_PAGE_SIZE + 1); // 6 total → 2 pages, page 2 has 1 row

  renderList(meterId);
  await user.click(screen.getByRole('button', { name: /Go to page 2/i }));
  expect(dataRows()).toHaveLength(1);

  // Delete the lone row on page 2 (in desc order, this is the oldest reading).
  await user.click(within(dataRows()[0]).getByRole('button', { name: /delete/i }));

  // View clamps back to the now-only page.
  expect(dataRows()).toHaveLength(READINGS_PAGE_SIZE);
  expect(screen.getByText(/Showing 1–5 of 5/)).toBeInTheDocument();
});

// ---- Import / Export ---------------------------------------------------

interface ExportCapture {
  blobs: Blob[];
  lastAnchor: HTMLAnchorElement | null;
}

function captureExportBlob(): ExportCapture {
  const capture: ExportCapture = { blobs: [], lastAnchor: null };
  // jsdom doesn't define URL.createObjectURL / revokeObjectURL — assign directly.
  // beforeEach calls vi.restoreAllMocks() which doesn't remove these, but the
  // next test seeds again or doesn't use them; tests are independent.
  (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (blob: Blob) => {
    capture.blobs.push(blob);
    return 'blob:test-url';
  };
  (URL as unknown as { revokeObjectURL: (s: string) => void }).revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    capture.lastAnchor = this;
  });
  return capture;
}

function makeExportFile(meterName: string, readings: { takenAt: string; reading: number }[]) {
  const payload = {
    schemaVersion: 2,
    exportedAt: '2026-05-20T00:00:00.000Z',
    meter: { id: 'src-meter', name: meterName, createdAt: '2026-01-01T00:00:00.000Z' },
    readings: readings.map(r => ({
      id: 'ignored',
      meterId: 'src-meter',
      reading: r.reading,
      takenAt: r.takenAt,
      createdAt: r.takenAt,
      source: 'homeowner',
    })),
  };
  return new File([JSON.stringify(payload)], 'export.json', { type: 'application/json' });
}

test('Export is disabled when the meter has no readings', () => {
  const meterId = seedMeter();
  renderList(meterId);
  expect(screen.getByRole('button', { name: /^Export$/ })).toBeDisabled();
});

test('Export downloads a JSON file with the current meter readings', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  seedReadings(meterId, 3);
  const capture = captureExportBlob();

  renderList(meterId);
  await user.click(screen.getByRole('button', { name: /^Export$/ }));

  expect(capture.blobs).toHaveLength(1);
  const text = await capture.blobs[0].text();
  const parsed = JSON.parse(text);
  expect(parsed.schemaVersion).toBe(2);
  expect(parsed.meter.name).toBe('Main');
  expect(parsed.readings).toHaveLength(3);
  expect(capture.lastAnchor?.download).toMatch(/^water-readings-main-\d{4}-\d{2}-\d{2}\.json$/);
});

test('Importing a file shows the confirm dialog with the reading count and source meter', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  renderList(meterId);

  const file = makeExportFile('Backup', [
    { takenAt: '2026-04-01T08:00:00.000Z', reading: 1200 },
    { takenAt: '2026-04-02T08:00:00.000Z', reading: 1201 },
  ]);

  await user.upload(screen.getByTestId('readings-import-input'), file);

  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText(/Import 2 readings/i)).toBeInTheDocument();
  expect(screen.getByText(/From meter .Backup./)).toBeInTheDocument();
});

test('Merge import skips duplicates by takenAt', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  // Existing reading at this exact takenAt — the imported one with the same
  // takenAt should be skipped.
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 999,
    takenAt: '2026-04-01T08:00:00.000Z',
    source: 'homeowner',
  });

  renderList(meterId);
  const file = makeExportFile('Backup', [
    { takenAt: '2026-04-01T08:00:00.000Z', reading: 1200 }, // duplicate
    { takenAt: '2026-04-02T08:00:00.000Z', reading: 1201 }, // new
  ]);

  await user.upload(screen.getByTestId('readings-import-input'), file);
  await user.click(screen.getByRole('button', { name: /^Import$/ }));

  const stored = useWaterTrackingStore.getState().readings;
  expect(stored).toHaveLength(2); // one original + one new (duplicate skipped)
  expect(stored.find(r => r.takenAt === '2026-04-01T08:00:00.000Z')?.reading).toBe(999);
  expect(stored.find(r => r.takenAt === '2026-04-02T08:00:00.000Z')?.reading).toBe(1201);
  expect(screen.getByText(/Imported 1 reading \(skipped 1 duplicate\)/)).toBeInTheDocument();
});

test('Replace import wipes only the target meter and inserts the imported readings', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  const { addMeter, addReading } = useWaterTrackingStore.getState().actions;
  const otherMeterId = addMeter('Garage');
  addReading({ meterId, reading: 100, takenAt: '2026-03-01T08:00:00.000Z', source: 'homeowner' });
  addReading({ meterId, reading: 110, takenAt: '2026-03-02T08:00:00.000Z', source: 'homeowner' });
  addReading({
    meterId: otherMeterId,
    reading: 555,
    takenAt: '2026-03-15T08:00:00.000Z',
    source: 'homeowner',
  });

  renderList(meterId);
  const file = makeExportFile('Backup', [{ takenAt: '2026-04-01T08:00:00.000Z', reading: 1300 }]);

  await user.upload(screen.getByTestId('readings-import-input'), file);
  await user.click(screen.getByLabelText(/Replace all readings on this meter/));
  await user.click(screen.getByRole('button', { name: /^Import$/ }));

  const stored = useWaterTrackingStore.getState().readings;
  const onTarget = stored.filter(r => r.meterId === meterId);
  const onOther = stored.filter(r => r.meterId === otherMeterId);
  expect(onTarget).toHaveLength(1);
  expect(onTarget[0].reading).toBe(1300);
  expect(onOther).toHaveLength(1);
  expect(onOther[0].reading).toBe(555);
});

test('Cancelling the import dialog leaves the store untouched', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  seedReadings(meterId, 2);
  const before = useWaterTrackingStore.getState().readings;

  renderList(meterId);
  const file = makeExportFile('Backup', [{ takenAt: '2026-04-01T08:00:00.000Z', reading: 1300 }]);

  await user.upload(screen.getByTestId('readings-import-input'), file);
  await user.click(screen.getByRole('button', { name: /^Cancel$/ }));

  expect(useWaterTrackingStore.getState().readings).toEqual(before);
});

test('An invalid file surfaces an error and leaves the store untouched', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  seedReadings(meterId, 1);
  const before = useWaterTrackingStore.getState().readings;

  renderList(meterId);
  const badFile = new File(['not json'], 'broken.json', { type: 'application/json' });

  await user.upload(screen.getByTestId('readings-import-input'), badFile);

  expect(await screen.findByText(/not valid JSON/i)).toBeInTheDocument();
  expect(useWaterTrackingStore.getState().readings).toEqual(before);
});
