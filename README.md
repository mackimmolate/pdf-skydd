## PDF Protector

This repository contains a browser-based app for adding an open password to a PDF locally on the user's device.

Project location: `pdf-protector/`

### What the app does

- Adds an open password to a PDF.
- Processes the file locally in the browser.
- Does not upload the PDF anywhere.
- Leaves post-open permissions unrestricted on purpose. The goal is only password protection.

### What the app does not do

- It does not recover forgotten passwords.
- It does not remove passwords from existing PDFs.
- It does not handle already encrypted PDFs.
- It does not guarantee document integrity against all PDF viewers or downstream tools.

### Development

```bash
cd pdf-protector
npm ci
npm run dev
```

### Verification

```bash
cd pdf-protector
npm run lint
npm test
npm run build
```
