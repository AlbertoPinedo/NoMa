import { useEffect, useState, type ChangeEvent } from 'react'

interface PhotoCaptureProps {
  file: File | null
  onFileChange: (file: File | null) => void
}

export function PhotoCapture({ file, onFileChange }: PhotoCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('')

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!file) {
    return (
      <div className="photo-capture">
        <label className="shutter">
          <input
            className="visually-hidden-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleChange}
          />
          <span aria-hidden="true" />
          Take photo for OCR
        </label>
      </div>
    )
  }

  return (
    <div className="photo-preview">
      <img src={previewUrl} alt="Photo preview for OCR" />
      <div className="preview-actions">
        <button type="button" onClick={() => onFileChange(null)} className="ghost-button">
          Cancel photo
        </button>
        <label>
          Retry photo
          <input
            className="visually-hidden-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleChange}
          />
        </label>
      </div>
    </div>
  )
}
