import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  getPasswordValidationMessage,
  getProtectPdfErrorMessage,
  protectPdf,
} from './utils/pdf';
import './App.css';

function getRejectedFileMessage(fileRejections: FileRejection[]): string {
  if (fileRejections.length === 0) {
    return 'Kunde inte läsa filen. Försök igen.';
  }

  const [{ errors }] = fileRejections;
  const sizeError = errors.find((rejection) => rejection.code === 'file-too-large');
  const typeError = errors.find((rejection) => rejection.code === 'file-invalid-type');
  const countError = errors.find((rejection) => rejection.code === 'too-many-files');

  if (sizeError) {
    return `Filen är för stor. Max ${MAX_FILE_SIZE_MB} MB.`;
  }

  if (typeError) {
    return 'Endast PDF-filer stöds.';
  }

  if (countError) {
    return 'Välj bara en PDF-fil åt gången.';
  }

  return 'Kunde inte läsa filen. Försök igen.';
}

function getDownloadFileName(fileName: string): string {
  const originalName = fileName.replace(/\.pdf$/i, '');
  return `${originalName}_locked.pdf`;
}

function toBlobBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [protectedPdfUrl, setProtectedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedProtect, setHasTriedProtect] = useState(false);

  const activeRequestIdRef = useRef(0);

  const revokeProtectedUrl = useCallback(() => {
    if (protectedPdfUrl) {
      URL.revokeObjectURL(protectedPdfUrl);
    }
  }, [protectedPdfUrl]);

  const clearProtectedResult = useCallback(() => {
    revokeProtectedUrl();
    setProtectedPdfUrl(null);
  }, [revokeProtectedUrl]);

  const cancelActiveRequest = useCallback(() => {
    activeRequestIdRef.current += 1;
    setIsProcessing(false);
  }, []);

  const clearForNewAttempt = useCallback(() => {
    cancelActiveRequest();
    setPassword('');
    setHasTriedProtect(false);
    setError(null);
    clearProtectedResult();
  }, [cancelActiveRequest, clearProtectedResult]);

  const handleReset = useCallback(() => {
    clearForNewAttempt();
    setFile(null);
  }, [clearForNewAttempt]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    clearForNewAttempt();
    setFile(acceptedFiles[0] ?? null);
  }, [clearForNewAttempt]);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    clearForNewAttempt();
    setFile(null);
    setError(getRejectedFileMessage(fileRejections));
  }, [clearForNewAttempt]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
  });

  useEffect(() => {
    return () => {
      activeRequestIdRef.current += 1;

      if (protectedPdfUrl) {
        URL.revokeObjectURL(protectedPdfUrl);
      }
    };
  }, [protectedPdfUrl]);

  const passwordError = getPasswordValidationMessage(password, {
    required: hasTriedProtect,
  });
  const blockingPasswordError = getPasswordValidationMessage(password, { required: true });
  const canProtect = Boolean(file) && !isProcessing && !blockingPasswordError;

  const handlePasswordChange = (nextPassword: string) => {
    setPassword(nextPassword);
    setError(null);
  };

  const handleProtect = async () => {
    setHasTriedProtect(true);

    if (!file || blockingPasswordError) {
      return;
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    setIsProcessing(true);
    setError(null);
    clearProtectedResult();

    try {
      const protectedBytes = await protectPdf(file, password);

      if (activeRequestIdRef.current !== requestId) {
        return;
      }

      const blob = new Blob([toBlobBytes(protectedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setProtectedPdfUrl(url);
    } catch (caughtError) {
      if (activeRequestIdRef.current !== requestId) {
        return;
      }

      console.error(caughtError);
      setError(getProtectPdfErrorMessage(caughtError));
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsProcessing(false);
      }
    }
  };

  const handleProtectClick = () => {
    void handleProtect();
  };

  const handleDownload = () => {
    if (!protectedPdfUrl || !file) {
      return;
    }

    const link = document.createElement('a');
    link.href = protectedPdfUrl;
    link.download = getDownloadFileName(file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <div className="hero">
        <p className="eyebrow">Lokal PDF-säkring</p>
        <h1>PDF-skydd</h1>
        <p className="lead">Lägg till ett öppningslösenord direkt i webbläsaren. Filen lämnar aldrig din enhet.</p>
      </div>

      <div className="card">
        {!file ? (
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
            aria-describedby="dropzone-help"
          >
            <input {...getInputProps()} />
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <p>{isDragActive ? 'Släpp PDF-filen här...' : 'Dra och släpp en PDF-fil här, eller klicka för att välja'}</p>
            <p id="dropzone-help" className="hint">Max {MAX_FILE_SIZE_MB} MB. Endast en fil åt gången.</p>
            {error && <p className="error-msg" role="alert">{error}</p>}
          </div>
        ) : (
          <div className="file-preview" aria-busy={isProcessing}>
            <div className="file-icon">
              PDF
              {protectedPdfUrl && (
                <div className="lock-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              )}
            </div>

            <p className="file-name">{file.name}</p>
            <p className="hint">Utdatafilen laddas ner som {getDownloadFileName(file.name)}</p>

            {!protectedPdfUrl ? (
              <>
                <div className="input-group">
                  <label htmlFor="password">Ange lösenord</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => handlePasswordChange(event.target.value)}
                    placeholder="Skriv in lösenord..."
                    autoComplete="new-password"
                    spellCheck={false}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby="password-help password-error"
                    disabled={isProcessing}
                  />
                  <p id="password-help" className="hint">
                    1-32 tecken. Latin-1 stöds, till exempel A-Ö, a-ö, siffror och vanliga symboler.
                  </p>
                  {passwordError && (
                    <p id="password-error" className="error-msg" role="alert">
                      {passwordError}
                    </p>
                  )}
                </div>

                {error && <p className="error-msg" role="alert">{error}</p>}

                <div className="actions">
                  <button className="btn-reset" type="button" onClick={handleReset}>
                    Avbryt
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={handleProtectClick}
                    disabled={!canProtect}
                  >
                    {isProcessing ? 'Skyddar...' : 'Skydda PDF'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="success-msg" role="status">
                  PDF-filen är skyddad lokalt och redo att laddas ner.
                </p>

                <div className="actions">
                  <button className="btn-reset" type="button" onClick={handleReset}>
                    Börja om
                  </button>
                  <button className="btn-primary" type="button" onClick={handleDownload}>
                    Ladda ner låst PDF
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card note-card">
        <h2>Viktigt att veta</h2>
        <ul className="note-list">
          <li>Appen lägger bara till ett öppningslösenord. Den försöker inte begränsa vad som är tillåtet efter att filen har öppnats.</li>
          <li>Glömmer du lösenordet finns ingen återställning i appen.</li>
          <li>Redan krypterade eller trasiga PDF-filer måste hanteras utanför appen.</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
