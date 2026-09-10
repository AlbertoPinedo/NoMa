export type Relationship =
  | 'origin'
  | 'ingredient'
  | 'manufacturer'
  | 'distributor'
  | 'processing'
  | 'company_address'
  | 'gs1'

export type Decision = 'accept' | 'reject' | 'review'

export type SourceField =
  | 'product_name'
  | 'description'
  | 'ingredients'
  | 'labels'
  | 'manufacturer'
  | 'distributor'
  | 'processing'
  | 'company_address'
  | 'gs1'

export interface ClassificationResult {
  morocco_reference: boolean
  confidence: number
  relationship: Relationship
  evidence: string
  decision: Decision
  sources: SourceField[]
  strict_mode_applied: boolean
}

export interface StrictModeConfig {
  origin: boolean
  ingredient: boolean
  manufacturer: boolean
  distributor: boolean
  processing: boolean
  company_address: boolean
  gs1Warning: boolean
}

export interface ProductData {
  gtin: string
  productName?: string
  description?: string
  ingredientsText?: string
  labelsText?: string
  brands?: string
  manufacturerName?: string
  distributorName?: string
  packagingText?: string
  companyAddress?: string
  countries?: string
}

export interface EvidenceAnalyzerInput {
  product: ProductData
  strictMode: StrictModeConfig
  heuristicResult: ClassificationResult
}

export interface EvidenceAnalyzer {
  analyze(input: EvidenceAnalyzerInput): Promise<ClassificationResult | null>
}
