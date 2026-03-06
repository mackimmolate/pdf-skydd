import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ProtectPdfError } from './utils/pdf';
import * as pdfUtils from './utils/pdf';

vi.mock('./utils/pdf', async () => {
  const actual = await vi.importActual<typeof import('./utils/pdf')>('./utils/pdf');

  return {
    ...actual,
    protectPdf: vi.fn(),
  };
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

async function uploadPdf(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  const input = container.querySelector('input[type="file"]');

  if (!(input instanceof HTMLInputElement)) {
    throw new Error('File input was not rendered.');
  }

  const file = new File([new Uint8Array([37, 80, 68, 70])], 'sample.pdf', {
    type: 'application/pdf',
  });

  await user.upload(input, file);
}

describe('App', () => {
  const protectPdfMock = vi.mocked(pdfUtils.protectPdf);
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    protectPdfMock.mockReset();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows inline validation for unsupported password characters', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await uploadPdf(container, user);
    await user.type(screen.getByLabelText('Ange lösenord'), '🔒');

    expect(
      screen.getByText(/^Lösenordet får bara innehålla Latin-1-tecken/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skydda PDF' })).toBeDisabled();
    expect(protectPdfMock).not.toHaveBeenCalled();
  });

  it('ignores stale protection results after reset', async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<Uint8Array>();
    protectPdfMock.mockReturnValueOnce(deferred.promise);

    const { container } = render(<App />);

    await uploadPdf(container, user);
    await user.type(screen.getByLabelText('Ange lösenord'), 'hemligt');
    await user.click(screen.getByRole('button', { name: 'Skydda PDF' }));
    await user.click(screen.getByRole('button', { name: 'Avbryt' }));

    deferred.resolve(new Uint8Array([1, 2, 3]));

    await waitFor(() => {
      expect(
        screen.getByText(/Dra och släpp en PDF-fil här, eller klicka för att välja/i),
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Ladda ner låst PDF' })).not.toBeInTheDocument();
    expect(vi.mocked(URL.createObjectURL).mock.calls).toHaveLength(0);
  });

  it('surfaces targeted error messages from the protection layer', async () => {
    const user = userEvent.setup();
    protectPdfMock.mockRejectedValueOnce(
      new ProtectPdfError(
        'encrypted-input',
        'PDF-filen är redan lösenordsskyddad och kan inte skyddas igen i den här appen.',
      ),
    );

    const { container } = render(<App />);

    await uploadPdf(container, user);
    await user.type(screen.getByLabelText('Ange lösenord'), 'hemligt');
    await user.click(screen.getByRole('button', { name: 'Skydda PDF' }));

    await screen.findByText(/redan lösenordsskyddad/i);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
