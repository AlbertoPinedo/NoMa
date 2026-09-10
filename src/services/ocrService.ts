import { createWorker } from 'tesseract.js'

export async function extractTextFromImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const worker = await createWorker('eng+spa+fra', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.(Math.round((message.progress ?? 0) * 100))
      }
    },
  })

  try {
    const result = await worker.recognize(file)
    onProgress?.(100)
    return result.data.text.trim()
  } finally {
    await worker.terminate()
  }
}
