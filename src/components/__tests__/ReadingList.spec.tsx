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
