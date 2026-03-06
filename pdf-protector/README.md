# PDF-skydd

Ett lokalt webbverktyg för att lägga till ett öppningslösenord på PDF-filer direkt i webbläsaren.

## Syfte

Appen har ett enda huvudmål: lösenordsskydda en PDF så att den kräver lösenord för att öppnas.

Den försöker inte använda PDF-behörigheter som ett säkerhetslager efter att filen har öppnats. När en användare väl har öppnat dokumentet ska läsning, utskrift, kopiering och formulärfyllning fungera normalt.

## Säkerhetsmodell

- Behandlingen sker lokalt i webbläsaren.
- Filen laddas inte upp av appen.
- Ett användarlösenord sätts för att öppna PDF-filen.
- Ett separat slumpat ägarlösenord skapas internt för att undvika trivial kringgång av PDF-metadata.
- Appen försöker inte erbjuda återställning av glömda lösenord.

## Begränsningar

- Endast en PDF åt gången.
- Max filstorlek: 25 MB.
- Endast o-krypterade PDF-filer stöds som indata.
- Lösenord måste vara 1-32 tecken långa.
- Lösenord måste kunna uttryckas med Latin-1-tecken.
  Exempel: `A-Ö`, `a-ö`, siffror och vanliga symboler fungerar.
  Exempel: emoji stöds inte.
- Trasiga eller ogiltiga PDF-filer avvisas.

## Användning

1. Välj en PDF-fil.
2. Ange ett lösenord.
3. Klicka på `Skydda PDF`.
4. Ladda ner den skyddade filen.

Utdatafilen får suffixet `_locked.pdf`.

## Teknisk översikt

- React + TypeScript + Vite
- `react-dropzone` för filval
- `pdf-lib-plus-encrypt` för PDF-kryptering

Krypteringsbiblioteket laddas först när skyddet faktiskt körs. Det håller den initiala appstarten mindre och minskar mängden kod som behövs innan användaren har valt en fil.

## Kvalitet och verifiering

Projektet innehåller automatiserade tester för:

- lösenordsvalidering
- lyckad PDF-kryptering
- redan krypterade PDF-filer
- UI-beteende för felhantering och avbrutna asynkrona körningar

Kör allt lokalt:

```bash
npm ci
npm run lint
npm test
npm run build
```

## Utveckling

Starta utvecklingsservern:

```bash
npm ci
npm run dev
```

## Deploy

GitHub Actions bygger projektet och publicerar `pdf-protector/dist` till `gh-pages`.

CI använder låst installation via `npm ci` för reproducerbara byggen.
