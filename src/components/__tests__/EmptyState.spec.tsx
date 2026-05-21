import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EmptyState } from '../EmptyState';

test('renders the "Begin the record." heading', () => {
  render(<EmptyState onCreateMeter={() => {}} />);
  expect(screen.getByRole('heading', { name: /begin the record/i })).toBeInTheDocument();
});

test('clicking "Register a meter" calls onCreateMeter', async () => {
  const user = userEvent.setup();
  const onCreateMeter = vi.fn();
  render(<EmptyState onCreateMeter={onCreateMeter} />);
  await user.click(screen.getByRole('button', { name: /register a meter/i }));
  expect(onCreateMeter).toHaveBeenCalledTimes(1);
});
