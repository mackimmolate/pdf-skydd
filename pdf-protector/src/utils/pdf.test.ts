// @vitest-environment node

import { PDFDocument } from 'pdf-lib-plus-encrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_PASSWORD_LENGTH,
  getPasswordValidationMessage,
  protectPdf,
} from './pdf';

function toBlobBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

async function createPdfFile(name = 'sample.pdf'): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([200, 200]);

  return new File([toBlobBytes(await pdfDoc.save())], name, { type: 'application/pdf' });
}

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  consoleErrorSpy.mockClear();
});

describe('getPasswordValidationMessage', () => {
  it('accepts a Latin-1 password', () => {
    expect(getPasswordValidationMessage('lösenord', { required: true })).toBeNull();
  });

  it('rejects passwords that are too long', () => {
    expect(
      getPasswordValidationMessage('a'.repeat(MAX_PASSWORD_LENGTH + 1), { required: true }),
    ).toContain(`${MAX_PASSWORD_LENGTH}`);
  });

  it('rejects characters outside Latin-1', () => {
    expect(getPasswordValidationMessage('🔒hemligt', { required: true })).toContain('Latin-1');
  });
});

describe('protectPdf', () => {
  it('adds an open password to a valid PDF', async () => {
    const file = await createPdfFile();
    const protectedBytes = await protectPdf(file, 'lösenord');

    expect(Buffer.from(protectedBytes).toString('latin1')).toContain('/Encrypt');
    await expect(PDFDocument.load(protectedBytes)).rejects.toThrow(/encrypted/i);
  });

  it('rejects already encrypted PDFs', async () => {
    const firstPass = await protectPdf(await createPdfFile('first.pdf'), 'lösenord');
    const encryptedFile = new File([toBlobBytes(firstPass)], 'encrypted.pdf', {
      type: 'application/pdf',
    });

    await expect(protectPdf(encryptedFile, 'nyttlösenord')).rejects.toMatchObject({
      code: 'encrypted-input',
    });
  });

  it('rejects unsupported password characters before returning bytes', async () => {
    await expect(protectPdf(await createPdfFile(), '🔒')).rejects.toMatchObject({
      code: 'unsupported-password-characters',
    });
  });
});
