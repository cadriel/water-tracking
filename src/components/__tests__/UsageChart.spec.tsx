import { beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageChart } from '../UsageChart';
import { useWaterTrackingStore } from '../../store/useWaterTrackingStore';

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

test('shows the "Awaiting a second reading" placeholder when fewer than two readings fall in the last 30 days', () => {
  const meterId = seedMeter();
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(2),
    source: 'homeowner',
  });
  render(<UsageChart meterId={meterId} />);
  expect(screen.getByText(/awaiting a second reading/i)).toBeInTheDocument();
});

test('readings older than 30 days are excluded from the chart window', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  addReading({
    meterId,
    reading: 1290,
    takenAt: isoDaysAgo(60),
    source: 'homeowner',
  });
  addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(2),
    source: 'homeowner',
  });

  render(<UsageChart meterId={meterId} />);
  // The 60-day-old reading is excluded, so only 1 falls in the window → placeholder.
  expect(screen.getByText(/awaiting a second reading/i)).toBeInTheDocument();
});

test('renders the chart frame with a sample count when there are two or more in-window readings', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(3),
    source: 'homeowner',
  });
  addReading({
    meterId,
    reading: 1305,
    takenAt: isoDaysAgo(1),
    source: 'homeowner',
  });

  render(<UsageChart meterId={meterId} />);
  expect(screen.queryByText(/awaiting a second reading/i)).not.toBeInTheDocument();
  // The frame's sub-tag reflects the in-window count.
  expect(screen.getByText('N=2')).toBeInTheDocument();
});
