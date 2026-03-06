export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 25;
export const MAX_PASSWORD_LENGTH = 32;

const PDF_MAJOR_VERSION = 1;
const PDF_MINOR_VERSION = 7;
const MAX_PASSWORD_CODE_POINT = 0xff;
const ACROBAT_SAFE_SAVE_OPTIONS = {
  useObjectStreams: false,
} as const;

const OPEN_PASSWORD_PERMISSIONS = {
  printing: 'highResolution' as const,
  modifying: true,
  copying: true,
  annotating: true,
  fillingForms: true,
  contentAccessibility: true,
  documentAssembly: true,
};

export type ProtectPdfErrorCode =
  | 'password-required'
  | 'password-too-long'
  | 'unsupported-password-characters'
  | 'encrypted-input'
  | 'invalid-pdf'
  | 'protection-failed';

export class ProtectPdfError extends Error {
  readonly code: ProtectPdfErrorCode;

  constructor(code: ProtectPdfErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProtectPdfError';
    this.code = code;
  }
}

function createOwnerPassword(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hasUnsupportedPasswordCharacters(password: string): boolean {
  for (const character of password) {
    if ((character.codePointAt(0) ?? 0) > MAX_PASSWORD_CODE_POINT) {
      return true;
    }
  }

  return false;
}

function validatePassword(
  password: string,
  options: { required?: boolean } = {},
): ProtectPdfError | null {
  const { required = true } = options;

  if (password.length === 0) {
    if (!required) {
      return null;
    }

    return new ProtectPdfError(
      'password-required',
      'Ange ett lösenord för att skydda PDF-filen.',
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return new ProtectPdfError(
      'password-too-long',
      `Lösenordet får vara högst ${MAX_PASSWORD_LENGTH} tecken långt.`,
    );
  }

  if (hasUnsupportedPasswordCharacters(password)) {
    return new ProtectPdfError(
      'unsupported-password-characters',
      'Lösenordet får bara innehålla Latin-1-tecken, till exempel A-Ö, a-ö, siffror och vanliga symboler.',
    );
  }

  return null;
}

function normalizeProtectPdfError(error: unknown): ProtectPdfError {
  if (error instanceof ProtectPdfError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.message.includes('Input document to `PDFDocument.load` is encrypted')) {
      return new ProtectPdfError(
        'encrypted-input',
        'PDF-filen är redan lösenordsskyddad och kan inte skyddas igen i den här appen.',
        { cause: error },
      );
    }

    if (
      error.message.includes('Failed to parse PDF document')
      || error.message.includes('No PDF header found')
    ) {
      return new ProtectPdfError(
        'invalid-pdf',
        'Filen kunde inte läsas som en giltig PDF. Kontrollera filen och försök igen.',
        { cause: error },
      );
    }

    if (error.message.includes('Password contains one or more invalid characters')) {
      return new ProtectPdfError(
        'unsupported-password-characters',
        'Lösenordet får bara innehålla Latin-1-tecken, till exempel A-Ö, a-ö, siffror och vanliga symboler.',
        { cause: error },
      );
    }
  }

  return new ProtectPdfError(
    'protection-failed',
    'Det gick inte att skydda PDF-filen. Försök igen.',
    error instanceof Error ? { cause: error } : undefined,
  );
}

export function getPasswordValidationMessage(
  password: string,
  options: { required?: boolean } = {},
): string | null {
  return validatePassword(password, options)?.message ?? null;
}

export function getProtectPdfErrorMessage(error: unknown): string {
  return normalizeProtectPdfError(error).message;
}

/**
 * Protects a PDF with an open password while leaving post-open permissions unrestricted.
 * The PDF is processed locally in the browser and never uploaded anywhere.
 */
export async function protectPdf(file: File, password: string): Promise<Uint8Array> {
  const validationError = validatePassword(password);

  if (validationError) {
    throw validationError;
  }

  const { PDFDocument, PDFHeader } = await import('pdf-lib-plus-encrypt');
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // The encryption library selects the PDF security revision from the header version.
    pdfDoc.context.header = PDFHeader.forVersion(PDF_MAJOR_VERSION, PDF_MINOR_VERSION);

    await pdfDoc.encrypt({
      userPassword: password,
      ownerPassword: createOwnerPassword(),
      permissions: OPEN_PASSWORD_PERMISSIONS,
    });

    // Acrobat is stricter than browser viewers about encrypted PDFs that use object streams.
    // Saving with classic xref tables avoids the repair prompt for generated files.
    return await pdfDoc.save(ACROBAT_SAFE_SAVE_OPTIONS);
  } catch (error) {
    throw normalizeProtectPdfError(error);
  }
}
