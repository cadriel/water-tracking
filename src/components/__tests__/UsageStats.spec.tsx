import { beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageStats } from '../UsageStats';
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

test('renders nothing when fewer than two readings exist for the meter', () => {
  const meterId = seedMeter();
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(2),
    source: 'homeowner',
  });
  const { container } = render(<UsageStats meterId={meterId} />);
  expect(container).toBeEmptyDOMElement();
});

test('renders all three labeled stat columns when there are enough readings', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(10),
    source: 'homeowner',
  });
  addReading({
    meterId,
    reading: 1305,
    takenAt: isoDaysAgo(5),
    source: 'homeowner',
  });

  render(<UsageStats meterId={meterId} />);
  expect(screen.getByText('All time')).toBeInTheDocument();
  expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  expect(screen.getByText('Last billing cycle')).toBeInTheDocument();
});

test('shows the "Awaiting 2 utility reads" caption when no two utility reads exist', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(10),
    source: 'homeowner',
  });
  addReading({
    meterId,
    reading: 1305,
    takenAt: isoDaysAgo(5),
    source: 'homeowner',
  });

  render(<UsageStats meterId={meterId} />);
  expect(screen.getByText(/awaiting 2 utility reads/i)).toBeInTheDocument();
});
