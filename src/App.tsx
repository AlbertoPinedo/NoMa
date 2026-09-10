import { ChangeEvent, useMemo, useState } from 'react'
import axios from 'axios'
import { classifyProduct } from './services/classifier'
import { detectFromLabelText } from './services/moroccoDetector'
import { fetchProductByGtin } from './services/openFoodFacts'
import { extractTextFromImage } from './services/ocrService'
import { useStrictModeStore } from './store/strictModeStore'
import type { ClassificationResult } from './types'

const EAN13 = /^\d{13}$/

const badge = {
  accept: '🟢 ACCEPT',
  reject: '🔴 REJECT',
  review: '🟡 REVIEW',
} as const

export function App() {
  const { config, setConfig } = useStrictModeStore()

  const [gtin, setGtin] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [productName, setProductName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => EAN13.test(gtin), [gtin])

  async function analyze() {
    setError('')
    setResult(null)
    setLoading(true)
    setProductName('')

    try {
      if (!EAN13.test(gtin)) {
        setError('EAN-13 must have exactly 13 digits.')
        return
      }

      const product = await fetchProductByGtin(gtin)
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

      setProductName(product.productName ?? `GTIN ${gtin}`)
      let classification = await classifyProduct(product, config)

      const needsOcr = classification.decision === 'review' && !!imageFile
      if (needsOcr) {
        const text = await extractTextFromImage(imageFile)
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

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setImageFile(file ?? null)
  }

  return (
    <main className="app">
      <h1>NoMa - Morocco Reference Detector</h1>
      <p className="subtitle">Real-time heuristic classification with optional OCR fallback (no product storage).</p>

      <section className="card">
        <h2>Barcode Scanner</h2>
        <label>
          EAN-13 input
          <input
            value={gtin}
            onChange={(e) => setGtin(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 8411234567890"
            maxLength={13}
          />
        </label>
        <label>
          Label image for OCR fallback (optional)
          <input type="file" accept="image/*" onChange={onFileChange} />
        </label>
        <button type="button" disabled={!canSubmit || loading} onClick={analyze}>
          {loading ? 'Loading OpenFoodFacts...' : 'Analyze product'}
        </button>
      </section>

      <section className="card">
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
      </section>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <section className="card result">
          <h2>Result</h2>
          <p className="status">{badge[result.decision]}</p>
          {productName ? <p><strong>Product:</strong> {productName}</p> : null}
          <p><strong>Evidence:</strong> {result.evidence}</p>
          <p><strong>Relationship:</strong> {result.relationship}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%</p>
          <p><strong>Sources:</strong> {result.sources.join(', ') || 'none'}</p>
          <p className="note">🟢 means no references detected, not guaranteed absence.</p>
        </section>
      ) : null}
    </main>
  )
}
