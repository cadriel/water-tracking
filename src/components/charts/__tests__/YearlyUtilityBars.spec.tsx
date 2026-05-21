import { beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YearlyUtilityBars } from '../YearlyUtilityBars';
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

test('shows the empty state when there are fewer than 2 utility reads in the year', () => {
  const meterId = seedMeter();
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(30),
    source: 'utility',
    isEstimated: false,
  });
  render(<YearlyUtilityBars meterId={meterId} />);
  expect(screen.getByText(/awaiting utility readings/i)).toBeInTheDocument();
});

test('ignores homeowner reads when computing the yearly view', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  // Many homeowner reads, only 1 utility read → empty state.
  for (let i = 0; i < 5; i++) {
    addReading({
      meterId,
      reading: 1300 + i * 0.1,
      takenAt: isoDaysAgo(300 - i * 60),
      source: 'homeowner',
    });
  }
  addReading({
    meterId,
    reading: 1305,
    takenAt: isoDaysAgo(10),
    source: 'utility',
    isEstimated: false,
  });
  render(<YearlyUtilityBars meterId={meterId} />);
  expect(screen.getByText(/awaiting utility readings/i)).toBeInTheDocument();
});

test('renders the chart frame with bar count when there are 2+ utility reads in the year', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  addReading({
    meterId,
    reading: 1290,
    takenAt: isoDaysAgo(300),
    source: 'utility',
    isEstimated: false,
  });
  addReading({
    meterId,
    reading: 1305,
    takenAt: isoDaysAgo(180),
    source: 'utility',
    isEstimated: true,
  });
  addReading({
    meterId,
    reading: 1320,
    takenAt: isoDaysAgo(20),
    source: 'utility',
    isEstimated: false,
  });
  render(<YearlyUtilityBars meterId={meterId} />);
  expect(screen.queryByText(/awaiting utility readings/i)).not.toBeInTheDocument();
  expect(screen.getByText('BARS=2')).toBeInTheDocument();
});

test('excludes utility reads older than 365 days', () => {
  const meterId = seedMeter();
  const { addReading } = useWaterTrackingStore.getState().actions;
  addReading({
    meterId,
    reading: 1200,
    takenAt: isoDaysAgo(400),
    source: 'utility',
    isEstimated: false,
  });
  addReading({
    meterId,
    reading: 1305,
    takenAt: isoDaysAgo(10),
    source: 'utility',
    isEstimated: false,
  });
  render(<YearlyUtilityBars meterId={meterId} />);
  // Only 1 utility read falls within 365 days → empty state.
  expect(screen.getByText(/awaiting utility readings/i)).toBeInTheDocument();
});

test('only considers reads for the selected meter', () => {
  const meterId = seedMeter();
  const otherMeterId = useWaterTrackingStore.getState().actions.addMeter('Other');
  const { addReading } = useWaterTrackingStore.getState().actions;
  // Other meter has plenty of utility reads.
  addReading({
    meterId: otherMeterId,
    reading: 500,
    takenAt: isoDaysAgo(200),
    source: 'utility',
    isEstimated: false,
  });
  addReading({
    meterId: otherMeterId,
    reading: 520,
    takenAt: isoDaysAgo(20),
    source: 'utility',
    isEstimated: false,
  });
  // Selected meter has only 1.
  addReading({
    meterId,
    reading: 1300,
    takenAt: isoDaysAgo(30),
    source: 'utility',
    isEstimated: false,
  });
  render(<YearlyUtilityBars meterId={meterId} />);
  expect(screen.getByText(/awaiting utility readings/i)).toBeInTheDocument();
});
