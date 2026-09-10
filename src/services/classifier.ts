import type { ClassificationResult, EvidenceAnalyzer, ProductData, StrictModeConfig } from '../types'
import { detectMoroccoReference } from './moroccoDetector'

export interface ClassifierOptions {
  llmAnalyzer?: EvidenceAnalyzer
}

export async function classifyProduct(
  product: ProductData,
  strictMode: StrictModeConfig,
  options: ClassifierOptions = {},
): Promise<ClassificationResult> {
  const heuristicResult = detectMoroccoReference(product, strictMode, true)

  if (!options.llmAnalyzer) {
    return heuristicResult
  }

  try {
    const llmResult = await options.llmAnalyzer.analyze({
      product,
      strictMode,
      heuristicResult,
    })

    return llmResult ?? heuristicResult
  } catch {
    return heuristicResult
  }
}
