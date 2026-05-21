import { beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ReadingList } from '../ReadingList';
import { useWaterTrackingStore } from '../../store/useWaterTrackingStore';

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
