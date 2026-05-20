export interface DigitParts {
  white: string;
  red: string;
}

export function splitDigits(reading: number): DigitParts {
  // Use the rounded total to avoid floating-point splits going off-by-one
  // (e.g. 1.12345 → red 1235, not 1234).
  const totalTenThousandths = Math.round(reading * 10000);
  const whole = Math.floor(totalTenThousandths / 10000);
  const fraction = totalTenThousandths - whole * 10000;
  return {
    white: String(whole).padStart(4, '0'),
    red: String(fraction).padStart(4, '0'),
  };
}

export function formatReading(reading: number): string {
  const { white, red } = splitDigits(reading);
  return `${white}.${red} m³`;
}

export function formatDelta(deltaM3: number): string {
  const sign = deltaM3 >= 0 ? '+' : '-';
  const absM3 = Math.abs(deltaM3);
  const absL = absM3 * 1000;
  return `${sign}${absM3.toFixed(4)} m³ / ${sign}${absL.toFixed(1)} L`;
}
