import type {
  ClassificationResult,
  ProductData,
  Relationship,
  SourceField,
  StrictModeConfig,
} from '../types'

interface Hit {
  relationship: Relationship
  source: SourceField
  evidence: string
  confidence: number
}

const BASE_TERMS = [
  'morocco',
  'moroccan',
  'maroc',
  'marruecos',
  'marocain',
  'marocaine',
  'originario de marruecos',
  'grown in morocco',
  'processed in morocco',
  'packed in morocco',
  'importado desde marruecos',
]

const RULES: Array<{ relationship: Relationship; source: SourceField; fields: (keyof ProductData)[]; confidence: number }> = [
  { relationship: 'origin', source: 'description', fields: ['description', 'countries', 'packagingText'], confidence: 0.98 },
  { relationship: 'ingredient', source: 'ingredients', fields: ['ingredientsText'], confidence: 0.97 },
  { relationship: 'manufacturer', source: 'manufacturer', fields: ['manufacturerName', 'brands'], confidence: 0.92 },
  { relationship: 'distributor', source: 'distributor', fields: ['distributorName'], confidence: 0.9 },
  { relationship: 'processing', source: 'processing', fields: ['packagingText', 'description'], confidence: 0.95 },
  { relationship: 'company_address', source: 'company_address', fields: ['companyAddress'], confidence: 0.88 },
]

const UNKNOWN_RESULT: ClassificationResult = {
  morocco_reference: false,
  confidence: 0.5,
  relationship: 'origin',
  evidence: 'Not enough product evidence from OpenFoodFacts. OCR review is recommended.',
  decision: 'review',
  sources: [],
  strict_mode_applied: true,
}

function containsMoroccoTerm(value: string): string | null {
  const normalized = value.toLowerCase()
  for (const term of BASE_TERMS) {
    if (normalized.includes(term)) {
      return term
    }
  }
  return null
}

function strictEnabled(cfg: StrictModeConfig, relationship: Relationship): boolean {
  switch (relationship) {
    case 'origin':
      return cfg.origin
    case 'ingredient':
      return cfg.ingredient
    case 'manufacturer':
      return cfg.manufacturer
    case 'distributor':
      return cfg.distributor
    case 'processing':
      return cfg.processing
    case 'company_address':
      return cfg.company_address
    case 'gs1':
      return cfg.gs1Warning
  }
}

function collectHits(product: ProductData): Hit[] {
  const hits: Hit[] = []

  for (const rule of RULES) {
    for (const field of rule.fields) {
      const value = product[field]
      if (!value) continue

      const term = containsMoroccoTerm(value)
      if (!term) continue

      hits.push({
        relationship: rule.relationship,
        source: rule.source,
        evidence: `Detected "${term}" in ${field}: ${value.slice(0, 220)}`,
        confidence: rule.confidence,
      })
      break
    }
  }

  if (product.gtin.startsWith('613')) {
    hits.push({
      relationship: 'gs1',
      source: 'gs1',
      evidence: 'GTIN starts with 613, which is Morocco GS1 prefix.',
      confidence: 0.7,
    })
  }

  return hits
}

function hasEnoughData(product: ProductData): boolean {
  return Boolean(product.productName || product.description || product.ingredientsText || product.labelsText)
}

export function detectMoroccoReference(
  product: ProductData,
  strictMode: StrictModeConfig,
  strictModeApplied = true,
): ClassificationResult {
  const hits = collectHits(product)

  if (!hits.length && !hasEnoughData(product)) {
    return { ...UNKNOWN_RESULT, strict_mode_applied: strictModeApplied }
  }

  const nonGs1StrictHit = hits.find((hit) => hit.relationship !== 'gs1' && strictEnabled(strictMode, hit.relationship))
  if (nonGs1StrictHit) {
    return {
      morocco_reference: true,
      confidence: nonGs1StrictHit.confidence,
      relationship: nonGs1StrictHit.relationship,
      evidence: nonGs1StrictHit.evidence,
      decision: 'reject',
      sources: [nonGs1StrictHit.source],
      strict_mode_applied: strictModeApplied,
    }
  }

  const gs1Hit = hits.find((hit) => hit.relationship === 'gs1')
  if (gs1Hit && strictMode.gs1Warning) {
    return {
      morocco_reference: true,
      confidence: gs1Hit.confidence,
      relationship: 'gs1',
      evidence: gs1Hit.evidence,
      decision: 'review',
      sources: ['gs1'],
      strict_mode_applied: strictModeApplied,
    }
  }

  return {
    morocco_reference: false,
    confidence: 0.92,
    relationship: 'origin',
    evidence: 'No Morocco references were detected in the consulted sources.',
    decision: 'accept',
    sources: ['product_name', 'description', 'ingredients', 'labels'],
    strict_mode_applied: strictModeApplied,
  }
}

export function detectFromLabelText(text: string, strictMode: StrictModeConfig): ClassificationResult {
  const labelProduct: ProductData = {
    gtin: '0000000000000',
    labelsText: text,
    description: text,
    ingredientsText: text,
    packagingText: text,
    companyAddress: text,
    manufacturerName: text,
    distributorName: text,
  }

  const result = detectMoroccoReference(labelProduct, strictMode)
  if (result.decision === 'accept') {
    return {
      ...result,
      decision: 'review',
      confidence: 0.55,
      evidence: 'OCR text did not clearly show Morocco references. Manual review advised.',
      sources: ['labels'],
    }
  }

  return {
    ...result,
    sources: ['labels'],
  }
}
