# NoMa

React + TypeScript app (Vite) to detect explicit Morocco references in consumer products in real time.

## MVP features

- EAN-13 manual scanner input
- OpenFoodFacts live lookup (no product caching/storage)
- Strict-mode Morocco reference detection
- OCR fallback with Tesseract.js when classification is uncertain
- Result states: 🟢 Accept / 🔴 Reject / 🟡 Review
- Optional configurable LLM analyzer hook (heuristics are default/offline)

## Run

```bash
npm install
npm run dev
```

## Test and build

```bash
npm test -- src/services/moroccoDetector.test.ts
npm run lint
npm run build
```
