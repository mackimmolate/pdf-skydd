import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

const createObjectUrlMock = vi.fn(() => 'blob:protected-pdf');
const revokeObjectUrlMock = vi.fn();

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: createObjectUrlMock,
  writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  value: revokeObjectUrlMock,
  writable: true,
});

beforeEach(() => {
  createObjectUrlMock.mockReset();
  createObjectUrlMock.mockReturnValue('blob:protected-pdf');
  revokeObjectUrlMock.mockReset();
  cleanup();
});
