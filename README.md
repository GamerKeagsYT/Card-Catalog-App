# Card Catalog App

Local-only desktop app inspired by traditional library card catalogs.

## Run locally

```bash
npm install
npm run start
```

## Build Windows `.exe`

From the project root:

```bash
npm install
npm run dist:win
```

Build artifact will be written to:

- `release/Card Catalog-<version>-<arch>.exe` (NSIS installer)

## Other packaging commands

```bash
npm run pack   # unpacked directory build
npm run dist   # build for current host defaults
```
