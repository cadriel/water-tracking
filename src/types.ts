export type ReadingSource = 'homeowner' | 'utility';

export interface Meter {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
}

export interface Reading {
  id: string;
  meterId: string;
  reading: number; // decimal m³, e.g. 1234.5678
  takenAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  source: ReadingSource;
  // Only meaningful when source === 'utility'. Utilities sometimes estimate
  // readings instead of physically reading the meter; tag those as estimated.
  isEstimated?: boolean;
}

export interface NewReadingInput {
  meterId: string;
  reading: number;
  takenAt: string;
  source: ReadingSource;
  isEstimated?: boolean;
}
