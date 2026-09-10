import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface ScannerProps {
  open: boolean
  onDetected: (code: string) => void
  onClose: () => void
}

export function Scanner({ open, onDetected, onClose }: ScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)
  const [detectedCode, setDetectedCode] = useState('')
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const regionId = `scanner-region-${useId().replace(/:/g, '')}`

  useEffect(() => {
    onDetectedRef.current = onDetected
    onCloseRef.current = onClose
  }, [onClose, onDetected])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const scanner = new Html5Qrcode(regionId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.QR_CODE],
    })
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const side = Math.min(viewfinderWidth, viewfinderHeight) * 0.8
            return { width: side, height: side }
          },
        },
        (decodedText) => {
          if (cancelled) return
          setDetectedCode(decodedText)
          void scanner.stop().finally(() => {
            onDetectedRef.current(decodedText)
            window.setTimeout(() => onCloseRef.current(), 700)
          })
        },
        () => undefined,
      )
      .then(() => {
        const capabilities = scanner.getRunningTrackCapabilities() as { torchFeature?: { supported?: boolean } }
        setTorchAvailable(Boolean(capabilities?.torchFeature?.supported))
      })
      .catch(() => {
        onCloseRef.current()
      })

    return () => {
      cancelled = true
      const current = scannerRef.current
      if (!current) return
      if (current.isScanning) {
        void current.stop().finally(() => void current.clear())
      } else {
        void current.clear()
      }
    }
  }, [open, regionId])

  async function toggleTorch() {
    const scanner = scannerRef.current
    if (!scanner) return

    const nextState = !torchEnabled
    try {
      await scanner.applyVideoConstraints({
        advanced: [{ torch: nextState } as MediaTrackConstraintSet],
      })
      setTorchEnabled(nextState)
    } catch {
      setTorchAvailable(false)
    }
  }

  if (!open) return null

  return (
    <div className="scanner-sheet" role="dialog" aria-modal="true">
      <div className="scanner-header">
        <h2>Scan barcode</h2>
        <button type="button" onClick={onClose} className="ghost-button">
          Close
        </button>
      </div>
      <div className="scanner-frame">
        <div id={regionId} className="scanner-region" />
        <div className="scanner-overlay" />
      </div>
      <div className="scanner-actions">
        <button type="button" onClick={toggleTorch} disabled={!torchAvailable}>
          {torchEnabled ? 'Torch off' : 'Torch on'}
        </button>
        {detectedCode ? <p className="detected">Detected: {detectedCode}</p> : <p>Point camera at QR or EAN-13.</p>}
      </div>
    </div>
  )
}
