# NoMa

React + TypeScript app (Vite) to detect explicit Morocco references in consumer products in real time.

## MVP features

- Live camera scanner (QR + EAN-13) with `html5-qrcode`
- Manual EAN-13 fallback when camera is denied
- Mobile-first UI with sticky header, bottom scanner sheet, and touch-friendly controls
- OpenFoodFacts live lookup (no product caching/storage)
- Strict-mode Morocco reference detection
- Photo capture + preview for OCR fallback with progress
- PWA install support (manifest + service worker + iPhone add-to-home-screen guidance)
- Result states: 🟢 Accept / 🔴 Reject / 🟡 Review

## Run

```bash
npm install
npm run dev
```

## Test and build

```bash
npm test -- src/services/moroccoDetector.test.ts
npm test -- src/hooks/useCameraPermission.test.ts
npm run lint
npm run build
```
