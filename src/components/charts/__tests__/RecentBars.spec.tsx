import { beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentBars } from '../RecentBars';
import { useWaterTrackingStore } from '../../../store/useWaterTrackingStore';

function seedMeter(): string {
  return useWaterTrackingStore.getState().actions.addMeter('Main');
}

function isoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

beforeEach(() => {
  localStorage.clear();
  useWaterTrackingStore.setState({ meters: [], readings: [], selectedMeterId: null });
});

test('shows "Awaiting a second reading" when fewer than 2 reads exist', () => {
  const meterId = seedMeter();
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(2),
    source: 'homeowner',
  });
  render(<RecentBars meterId={meterId} />);
  expect(screen.getByText(/awaiting a second reading/i)).toBeInTheDocument();
});

test('renders in last30days mode when 6+ reads fall in the window', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  for (let i = 0; i < 6; i++) {
    addReading({
      meterId,
      reading: 1300 + i * 0.05,
      takenAt: isoDaysAgo(25 - i * 4),
      source: 'homeowner',
    });
  }
  render(<RecentBars meterId={meterId} />);
  expect(screen.getByText(/window · 30 days/i)).toBeInTheDocument();
  expect(screen.queryByText(/last 12 reads/i)).not.toBeInTheDocument();
});

test('falls back to last12reads mode when fewer than 6 reads in window', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  // Only 2 in-window reads but several older ones.
  addReading({ meterId, reading: 1000, takenAt: isoDaysAgo(120), source: 'homeowner' });
  addReading({ meterId, reading: 1010, takenAt: isoDaysAgo(90), source: 'homeowner' });
  addReading({ meterId, reading: 1020, takenAt: isoDaysAgo(60), source: 'homeowner' });
  addReading({ meterId, reading: 1030, takenAt: isoDaysAgo(40), source: 'homeowner' });
  addReading({ meterId, reading: 1040, takenAt: isoDaysAgo(20), source: 'homeowner' });
  addReading({ meterId, reading: 1050, takenAt: isoDaysAgo(5), source: 'homeowner' });
  render(<RecentBars meterId={meterId} />);
  expect(screen.getByText(/last 12 reads/i)).toBeInTheDocument();
});

test('only considers reads from the selected meter', () => {
  const meterId = seedMeter();
  const otherMeterId = useWaterTrackingStore.getState().actions.addMeter('Other');
  const { addReading } = useWaterTrackingStore.getState().actions;
  // The selected meter only has 1 read → placeholder.
  addReading({ meterId, reading: 1000, takenAt: isoDaysAgo(2), source: 'homeowner' });
  // The other meter has many reads but they should be ignored.
  for (let i = 0; i < 6; i++) {
    addReading({
      meterId: otherMeterId,
      reading: 2000 + i * 0.05,
      takenAt: isoDaysAgo(25 - i * 4),
      source: 'homeowner',
    });
  }
  render(<RecentBars meterId={meterId} />);
  expect(screen.getByText(/awaiting a second reading/i)).toBeInTheDocument();
});
