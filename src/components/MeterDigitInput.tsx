import { useRef } from 'react';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';

export interface DigitValue {
  white: string;
  red: string;
}

interface MeterDigitInputProps {
  value: DigitValue;
  onChange: (next: DigitValue) => void;
}

const DigitBox = styled(InputBase, {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'white' | 'red' }>(({ theme, tone }) => ({
  width: 32,
  height: 44,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 4,
  backgroundColor: tone === 'white' ? theme.palette.background.paper : theme.palette.error.main,
  color: tone === 'white' ? theme.palette.text.primary : theme.palette.common.white,
  '& input': {
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: '1.25rem',
    padding: 0,
  },
}));

const TOTAL_DIGITS = 8;
const WHITE_DIGITS = 4;

function joinDigits(value: DigitValue): string {
  return (value.white + value.red).padEnd(TOTAL_DIGITS, ' ').slice(0, TOTAL_DIGITS);
}

function splitDigits(joined: string): DigitValue {
  const trimmed = joined.replace(/\s+$/, '');
  return {
    white: trimmed.slice(0, WHITE_DIGITS),
    red: trimmed.slice(WHITE_DIGITS, TOTAL_DIGITS),
  };
}

export function MeterDigitInput({ value, onChange }: MeterDigitInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const joined = joinDigits(value);

  function setDigitAt(index: number, char: string) {
    const next = joined.split('');
    next[index] = char;
    const compact = next.join('').replace(/\s+$/, '');
    onChange(splitDigits(compact));
  }

  function handleChange(index: number) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const digit = raw.replace(/\D/g, '').slice(-1);
      if (!digit) return;
      setDigitAt(index, digit);
      const nextInput = inputs.current[index + 1];
      if (nextInput) nextInput.focus();
    };
  }

  function handleKeyDown(index: number) {
    return (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace') {
        const currentChar = joined[index];
        if (!currentChar || currentChar === ' ') {
          const prev = inputs.current[index - 1];
          if (prev) {
            event.preventDefault();
            prev.focus();
          }
        } else {
          setDigitAt(index, ' ');
        }
      }
    };
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, TOTAL_DIGITS);
    if (!digits) return;
    event.preventDefault();
    onChange(splitDigits(digits));
    const nextIndex = Math.min(digits.length, TOTAL_DIGITS - 1);
    inputs.current[nextIndex]?.focus();
  }

  function renderBox(index: number) {
    const tone: 'white' | 'red' = index < WHITE_DIGITS ? 'white' : 'red';
    const char = joined[index];
    return (
      <DigitBox
        key={index}
        tone={tone}
        inputProps={{
          inputMode: 'numeric',
          maxLength: 1,
          'aria-label': `${tone} digit ${(index % WHITE_DIGITS) + 1}`,
        }}
        inputRef={(el: HTMLInputElement | null) => {
          inputs.current[index] = el;
        }}
        value={char === ' ' ? '' : (char ?? '')}
        onChange={handleChange(index)}
        onKeyDown={handleKeyDown(index)}
        onPaste={handlePaste}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {Array.from({ length: WHITE_DIGITS }, (_, i) => renderBox(i))}
      <Box sx={{ width: 8 }} />
      {Array.from({ length: WHITE_DIGITS }, (_, i) => renderBox(WHITE_DIGITS + i))}
    </Box>
  );
}
