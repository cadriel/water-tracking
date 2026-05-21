import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MeterDigitInput, type DigitValue } from '../MeterDigitInput';

function ControlledHarness({
  initialValue = { white: '', red: '' },
  onChange,
}: {
  initialValue?: DigitValue;
  onChange?: (next: DigitValue) => void;
}) {
  const [value, setValue] = useState<DigitValue>(initialValue);
  return (
    <MeterDigitInput
      value={value}
      onChange={next => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

function renderHarness(initialValue?: DigitValue) {
  const onChange = vi.fn();
  render(<ControlledHarness initialValue={initialValue} onChange={onChange} />);
  return { onChange };
}

test('renders 8 digit boxes', () => {
  renderHarness();
  expect(screen.getAllByRole('textbox')).toHaveLength(8);
});

test('typing into the first box fills it and advances focus', async () => {
  const user = userEvent.setup();
  const { onChange } = renderHarness();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.keyboard('5');
  expect(onChange).toHaveBeenLastCalledWith({ white: '5', red: '' });
});

test('typing 8 digits in sequence builds up the full value', async () => {
  const user = userEvent.setup();
  const { onChange } = renderHarness();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.keyboard('12345678');
  expect(onChange).toHaveBeenLastCalledWith({ white: '1234', red: '5678' });
});

test('non-digit characters are ignored', async () => {
  const user = userEvent.setup();
  const { onChange } = renderHarness();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.keyboard('a');
  expect(onChange).not.toHaveBeenCalled();
});

test('pasting 8 digits fills every box', async () => {
  const user = userEvent.setup();
  const { onChange } = renderHarness();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.paste('12345678');
  expect(onChange).toHaveBeenLastCalledWith({ white: '1234', red: '5678' });
});

test('pasting a non-digit-containing string strips the non-digits', async () => {
  const user = userEvent.setup();
  const { onChange } = renderHarness();
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[0]);
  await user.paste('12 34.56 78');
  expect(onChange).toHaveBeenLastCalledWith({ white: '1234', red: '5678' });
});

test('Backspace on an empty box moves focus to the previous box', async () => {
  const user = userEvent.setup();
  renderHarness({ white: '12', red: '' });
  const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
  inputs[2].focus();
  await user.keyboard('{Backspace}');
  expect(document.activeElement).toBe(inputs[1]);
});
