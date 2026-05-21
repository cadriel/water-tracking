import { beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsageChart } from '../UsageChart';
import { useWaterTrackingStore } from '../../store/useWaterTrackingStore';

function seedMeter(): string {
  return useWaterTrackingStore.getState().actions.addMeter('Main');
}

function isoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function seedDenseRecentReads(meterId: string): void {
  const { addReading } = useWaterTrackingStore.getState().actions;
  for (let i = 0; i < 6; i++) {
    addReading({
      meterId,
      reading: 1300 + i * 0.05,
      takenAt: isoDaysAgo(25 - i * 4),
      source: 'homeowner',
    });
  }
}

beforeEach(() => {
  localStorage.clear();
  useWaterTrackingStore.setState({ meters: [], readings: [], selectedMeterId: null });
});

test('renders the Hydrograph section header', () => {
  const meterId = seedMeter();
  render(<UsageChart meterId={meterId} />);
  expect(screen.getByText(/section 03 · hydrograph/i)).toBeInTheDocument();
});

test('defaults to the Recent (30 D) view', () => {
  const meterId = seedMeter();
  seedDenseRecentReads(meterId);
  render(<UsageChart meterId={meterId} />);
  // The Recent view shows the mode subtitle; the line view does not.
  expect(screen.getByText(/window · 30 days/i)).toBeInTheDocument();
});

test('clicking the 12 MO toggle switches to the yearly utility bars view', async () => {
  const meterId = seedMeter();
  seedDenseRecentReads(meterId);
  const user = userEvent.setup();
  render(<UsageChart meterId={meterId} />);

  await user.click(screen.getByRole('button', { name: /12 mo/i }));

  // Yearly view shows its own subtitle and either an empty state or bar count.
  expect(screen.getByText(/window · 12 months/i)).toBeInTheDocument();
  expect(screen.queryByText(/window · 30 days/i)).not.toBeInTheDocument();
});

test('clicking the TREND toggle switches to the line chart view', async () => {
  const meterId = seedMeter();
  seedDenseRecentReads(meterId);
  const user = userEvent.setup();
  render(<UsageChart meterId={meterId} />);

  await user.click(screen.getByRole('button', { name: /trend/i }));

  // The line chart uses the N= sub-tag pattern; the recent bars view uses BARS=.
  expect(screen.queryByText(/window · 30 days/i)).not.toBeInTheDocument();
  expect(screen.getByText(/^N=/)).toBeInTheDocument();
});

test('clicking back to the 30 D toggle returns to the recent bars view', async () => {
  const meterId = seedMeter();
  seedDenseRecentReads(meterId);
  const user = userEvent.setup();
  render(<UsageChart meterId={meterId} />);

  await user.click(screen.getByRole('button', { name: /trend/i }));
  await user.click(screen.getByRole('button', { name: /30 d/i }));

  expect(screen.getByText(/window · 30 days/i)).toBeInTheDocument();
});
