import { render, screen } from '@testing-library/react';
import { BlueprintFrame } from '../BlueprintFrame';

test('renders children', () => {
  render(
    <BlueprintFrame>
      <div>inside the frame</div>
    </BlueprintFrame>,
  );
  expect(screen.getByText('inside the frame')).toBeInTheDocument();
});

test('renders the tag chip with main and sub tags when both are provided', () => {
  render(
    <BlueprintFrame tag="LOG/01" subTag="N=5">
      <div>x</div>
    </BlueprintFrame>,
  );
  expect(screen.getByText('LOG/01')).toBeInTheDocument();
  expect(screen.getByText('N=5')).toBeInTheDocument();
});

test('omits the tag chip when no tag is provided', () => {
  render(
    <BlueprintFrame>
      <div>x</div>
    </BlueprintFrame>,
  );
  expect(screen.queryByText(/LOG\//)).not.toBeInTheDocument();
});
