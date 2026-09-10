import { useMemo, useState } from 'react'
import axios from 'axios'
import { CameraPermission } from './components/CameraPermission'
import { PhotoCapture } from './components/PhotoCapture'
import { Scanner } from './components/Scanner'
import { useCameraPermission } from './hooks/useCameraPermission'
import { classifyProduct } from './services/classifier'
import { detectFromLabelText } from './services/moroccoDetector'
import { fetchProductByGtin } from './services/openFoodFacts'
import { extractTextFromImage } from './services/ocrService'
import { useStrictModeStore } from './store/strictModeStore'
import type { ClassificationResult } from './types'
import { isIosDevice } from './utils/mobile'

const EAN13 = /^\d{13}$/

const badge = {
  accept: '🟢 ACCEPT',
  reject: '🔴 REJECT',
  review: '🟡 REVIEW',
} as const

export function App() {
  const { config, setConfig } = useStrictModeStore()
  const camera = useCameraPermission()

  const [gtin, setGtin] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [productName, setProductName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [cacheMessage, setCacheMessage] = useState('')

  const isIos = typeof navigator !== 'undefined' && isIosDevice(navigator.userAgent)
  const standalone = useMemo(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true),
    [],
  )
  const canSubmit = useMemo(() => EAN13.test(gtin), [gtin])

  async function analyze(inputCode = gtin) {
    setError('')
    setResult(null)
    setLoading(true)
    setProductName('')
    setOcrProgress(0)

    try {
      if (!EAN13.test(inputCode)) {
        setError('EAN-13 must have exactly 13 digits.')
        return
      }

      const product = await fetchProductByGtin(inputCode)
      if (!product) {
        setResult({
          morocco_reference: false,
          confidence: 0.45,
          relationship: 'origin',
          evidence: 'Product not found in OpenFoodFacts. OCR label review is required.',
          decision: 'review',
          sources: ['product_name'],
          strict_mode_applied: true,
        })
        return
      }

      setProductName(product.productName ?? `GTIN ${inputCode}`)
      let classification = await classifyProduct(product, config)

      const needsOcr = classification.decision === 'review' && !!imageFile
      if (needsOcr) {
        const text = await extractTextFromImage(imageFile, setOcrProgress)
        classification = detectFromLabelText(text, config)
      }

      setResult(classification)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(`OpenFoodFacts lookup failed: ${err.message}`)
      } else {
        setError('Unexpected error while analyzing product.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function openScanner() {
    if (camera.state !== 'granted') {
      const permission = await camera.request()
      if (permission !== 'granted') {
        return
      }
    }
    setScannerOpen(true)
  }

  async function clearCache() {
    if (!('caches' in window)) {
      setCacheMessage('Cache API is not available on this browser.')
      return
    }
    const names = await caches.keys()
    await Promise.all(names.map((name) => caches.delete(name)))
    setCacheMessage('Cached data was cleared.')
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1>NoMa</h1>
        <div className="topbar-actions">
          <button type="button" onClick={openScanner}>Scan</button>
          <button type="button" onClick={() => setShowSettings((value) => !value)} className="ghost-button">
            Settings
          </button>
        </div>
      </header>

      {isIos && !standalone ? (
        <section className="card install-card">
          <p>Add NoMa to Home Screen: Share → “Add to Home Screen”.</p>
        </section>
      ) : null}

      {camera.state !== 'granted' ? (
        <CameraPermission denied={camera.state === 'denied'} onRequest={() => void camera.request()} />
      ) : null}

      <section className="card">
        <h2>Barcode</h2>
        <label>
          EAN-13 input fallback
          <input
            value={gtin}
            inputMode="numeric"
            onChange={(e) => setGtin(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 8411234567890"
            maxLength={13}
          />
        </label>
        <button type="button" disabled={!canSubmit || loading} onClick={() => void analyze()}>
          {loading ? 'Analyzing...' : 'Analyze product'}
        </button>
      </section>

      <section className="card">
        <h2>Photo OCR fallback</h2>
        <PhotoCapture file={imageFile} onFileChange={setImageFile} />
        {loading && ocrProgress > 0 ? <p>OCR progress: {ocrProgress}%</p> : null}
      </section>

      {showSettings ? (
        <section className="card settings">
          <h2>Strict Mode Settings</h2>
          <div className="checks">
            <label><input type="checkbox" checked={config.origin} onChange={(e) => setConfig({ origin: e.target.checked })} /> Product origin</label>
            <label><input type="checkbox" checked={config.ingredient} onChange={(e) => setConfig({ ingredient: e.target.checked })} /> Ingredient origin</label>
            <label><input type="checkbox" checked={config.manufacturer} onChange={(e) => setConfig({ manufacturer: e.target.checked })} /> Manufacturer</label>
            <label><input type="checkbox" checked={config.distributor} onChange={(e) => setConfig({ distributor: e.target.checked })} /> Distributor</label>
            <label><input type="checkbox" checked={config.processing} onChange={(e) => setConfig({ processing: e.target.checked })} /> Processing / packaging</label>
            <label><input type="checkbox" checked={config.company_address} onChange={(e) => setConfig({ company_address: e.target.checked })} /> Company address / HQ</label>
            <label><input type="checkbox" checked={config.gs1Warning} onChange={(e) => setConfig({ gs1Warning: e.target.checked })} /> GS1 prefix 613 (warning only)</label>
          </div>
          <button type="button" className="ghost-button" onClick={() => void clearCache()}>
            Clear cache
          </button>
          {cacheMessage ? <p>{cacheMessage}</p> : null}
        </section>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <section className="card result">
          <h2>Result</h2>
          <p className="status">{badge[result.decision]}</p>
          {productName ? <p><strong>Product:</strong> {productName}</p> : null}
          <p><strong>Evidence:</strong> {result.evidence}</p>
          <p><strong>Relationship:</strong> {result.relationship}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%</p>
        </section>
      ) : null}

      <Scanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onError={setError}
        onDetected={(code) => {
          const trimmed = code.trim()
          if (EAN13.test(trimmed)) {
            setGtin(trimmed)
            void analyze(trimmed)
          } else {
            setError('Scanned code is not a valid EAN-13.')
          }
        }}
      />
    </main>
  )
}
