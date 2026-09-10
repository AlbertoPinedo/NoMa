import { createWorker } from 'tesseract.js'

export async function extractTextFromImage(file: File): Promise<string> {
  const worker = await createWorker('eng+spa+fra')

  try {
    const result = await worker.recognize(file)
    return result.data.text.trim()
  } finally {
    await worker.terminate()
  }
}
