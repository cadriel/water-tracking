import { beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ReadingFormDialog } from '../ReadingFormDialog';
import { useWaterTrackingStore } from '../../store/useWaterTrackingStore';
function renderForm(ui: ReactElement) {
  return render(<LocalizationProvider dateAdapter={AdapterDateFns}>{ui}</LocalizationProvider>);
}

function seedMeter(): string {
  return useWaterTrackingStore.getState().actions.addMeter('Main');
}

async function fillDigits(user: ReturnType<typeof userEvent.setup>, value: string) {
  const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
  await user.click(inputs[0]);
  await user.keyboard(value);
}

beforeEach(() => {
  localStorage.clear();
  useWaterTrackingStore.setState({ meters: [], readings: [], selectedMeterId: null });
});

test('"Add reading" is disabled until 8 digits are entered', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  renderForm(<ReadingFormDialog open onClose={() => {}} meterId={meterId} editingReading={null} />);

  const submit = screen.getByRole('button', { name: /add reading/i });
  expect(submit).toBeDisabled();

  await fillDigits(user, '13060000');
  expect(submit).toBeEnabled();
});

test('Estimated toggle is hidden for homeowner reads and shown for utility', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  renderForm(<ReadingFormDialog open onClose={() => {}} meterId={meterId} editingReading={null} />);

  expect(screen.queryByRole('button', { name: /^estimated$/i })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /^utility$/i }));
  expect(screen.getByRole('button', { name: /^actual$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^estimated$/i })).toBeInTheDocument();
});

test('submitting saves a homeowner reading to the store', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const meterId = seedMeter();
  renderForm(<ReadingFormDialog open onClose={onClose} meterId={meterId} editingReading={null} />);

  await fillDigits(user, '13060000');
  await user.click(screen.getByRole('button', { name: /add reading/i }));

  const readings = useWaterTrackingStore.getState().readings;
  expect(readings).toHaveLength(1);
  expect(readings[0]).toMatchObject({ meterId, reading: 1306, source: 'homeowner' });
  expect(readings[0].isEstimated).toBeUndefined();
  expect(onClose).toHaveBeenCalled();
});

test('submitting a Utility + Estimated reading stores isEstimated=true', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  renderForm(<ReadingFormDialog open onClose={() => {}} meterId={meterId} editingReading={null} />);

  await user.click(screen.getByRole('button', { name: /^utility$/i }));
  await user.click(screen.getByRole('button', { name: /^estimated$/i }));
  await fillDigits(user, '13060000');
  await user.click(screen.getByRole('button', { name: /add reading/i }));

  const reading = useWaterTrackingStore.getState().readings[0];
  expect(reading.source).toBe('utility');
  expect(reading.isEstimated).toBe(true);
});

test('editing a utility/estimated reading hydrates source and isEstimated', () => {
  const meterId = seedMeter();
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 1306,
    takenAt: '2026-05-20T08:00:00.000Z',
    source: 'utility',
    isEstimated: true,
  });
  const existing = useWaterTrackingStore.getState().readings[0];

  renderForm(
    <ReadingFormDialog open onClose={() => {}} meterId={meterId} editingReading={existing} />,
  );

  // Both toggles reflect the existing reading.
  expect(screen.getByRole('button', { name: /^utility$/i })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /^estimated$/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('switching from Utility back to Homeowner clears the saved isEstimated flag', async () => {
  const user = userEvent.setup();
  const meterId = seedMeter();
  useWaterTrackingStore.getState().actions.addReading({
    meterId,
    reading: 1306,
    takenAt: '2026-05-20T08:00:00.000Z',
    source: 'utility',
    isEstimated: true,
  });
  const existing = useWaterTrackingStore.getState().readings[0];

  renderForm(
    <ReadingFormDialog open onClose={() => {}} meterId={meterId} editingReading={existing} />,
  );

  await user.click(screen.getByRole('button', { name: /^homeowner$/i }));
  await user.click(screen.getByRole('button', { name: /save changes/i }));

  const updated = useWaterTrackingStore.getState().readings[0];
  expect(updated.source).toBe('homeowner');
  expect(updated.isEstimated).toBeUndefined();
});
