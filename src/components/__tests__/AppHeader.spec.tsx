import { beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '../AppHeader';
import { useWaterTrackingStore } from '../../store/useWaterTrackingStore';

beforeEach(() => {
  localStorage.clear();
  useWaterTrackingStore.setState({ meters: [], readings: [], selectedMeterId: null });
});

test('hides the meter select when no meters are registered', () => {
  render(<AppHeader onManageMeters={() => {}} />);
  expect(screen.queryByLabelText(/^meter$/i)).not.toBeInTheDocument();
});

test('shows the currently selected meter in the select', () => {
  const id = useWaterTrackingStore.getState().actions.addMeter('Garden');
  useWaterTrackingStore.getState().actions.selectMeter(id);
  render(<AppHeader onManageMeters={() => {}} />);
  // The MUI Select renders the selected value as visible text inside the combobox.
  expect(screen.getByRole('combobox')).toHaveTextContent('Garden');
});

test('changing the select updates the selected meter in the store', async () => {
  const user = userEvent.setup();
  const a = useWaterTrackingStore.getState().actions.addMeter('Main');
  const b = useWaterTrackingStore.getState().actions.addMeter('Irrigation');
  useWaterTrackingStore.getState().actions.selectMeter(a);
  render(<AppHeader onManageMeters={() => {}} />);

  await user.click(screen.getByRole('combobox'));
  const listbox = await screen.findByRole('listbox');
  await user.click(within(listbox).getByText('Irrigation'));

  expect(useWaterTrackingStore.getState().selectedMeterId).toBe(b);
});

test('clicking "Meters" calls onManageMeters', async () => {
  const user = userEvent.setup();
  const onManageMeters = vi.fn();
  render(<AppHeader onManageMeters={onManageMeters} />);
  await user.click(screen.getByRole('button', { name: /^meters$/i }));
  expect(onManageMeters).toHaveBeenCalledTimes(1);
});
