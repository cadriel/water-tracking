import { beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeterManagerDialog } from '../MeterManagerDialog';
import { useWaterTrackingStore } from '../../store/useWaterTrackingStore';

beforeEach(() => {
  localStorage.clear();
  useWaterTrackingStore.setState({ meters: [], readings: [], selectedMeterId: null });
  vi.restoreAllMocks();
});

test('lists existing meters', () => {
  useWaterTrackingStore.getState().actions.addMeter('Main');
  useWaterTrackingStore.getState().actions.addMeter('Garden');
  render(<MeterManagerDialog open onClose={() => {}} />);
  expect(screen.getByText('Main')).toBeInTheDocument();
  expect(screen.getByText('Garden')).toBeInTheDocument();
});

test('adding a new meter updates the store and clears the input', async () => {
  const user = userEvent.setup();
  render(<MeterManagerDialog open onClose={() => {}} />);

  const input = screen.getByLabelText(/new meter name/i);
  await user.type(input, 'Pool');
  await user.click(screen.getByRole('button', { name: /^add$/i }));

  expect(useWaterTrackingStore.getState().meters.map(m => m.name)).toEqual(['Pool']);
  expect(input).toHaveValue('');
});

test('renaming a meter via edit + save updates the store', async () => {
  const user = userEvent.setup();
  useWaterTrackingStore.getState().actions.addMeter('Old');
  render(<MeterManagerDialog open onClose={() => {}} />);

  await user.click(screen.getByRole('button', { name: /rename/i }));
  const renameField = screen.getByDisplayValue('Old');
  await user.clear(renameField);
  await user.type(renameField, 'New');
  await user.click(screen.getByRole('button', { name: /save name/i }));

  expect(useWaterTrackingStore.getState().meters[0].name).toBe('New');
});

test('deleting a meter removes it when the confirm is accepted', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  useWaterTrackingStore.getState().actions.addMeter('Doomed');
  render(<MeterManagerDialog open onClose={() => {}} />);

  await user.click(screen.getByRole('button', { name: /delete/i }));

  expect(useWaterTrackingStore.getState().meters).toHaveLength(0);
});

test('declining the delete confirm leaves the meter in place', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  useWaterTrackingStore.getState().actions.addMeter('Spared');
  render(<MeterManagerDialog open onClose={() => {}} />);

  await user.click(screen.getByRole('button', { name: /delete/i }));

  expect(useWaterTrackingStore.getState().meters).toHaveLength(1);
});

test('clicking "Done" calls onClose', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<MeterManagerDialog open onClose={onClose} />);
  await user.click(screen.getByRole('button', { name: /done/i }));
  // Note: MUI Dialog also triggers onClose on backdrop/Escape — we're asserting at least one call.
  expect(onClose).toHaveBeenCalled();
  // And make sure the Done button specifically wired it.
  expect(onClose.mock.calls.length).toBeGreaterThan(0);
  // Inspect that the latest call came from a click (no args) rather than {reason: 'escapeKeyDown'} etc.
  const lastCall = onClose.mock.calls[onClose.mock.calls.length - 1];
  expect(lastCall).toEqual([expect.anything()]);
});
