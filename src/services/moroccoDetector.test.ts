import { describe, expect, it } from 'vitest'
import { detectMoroccoReference } from './moroccoDetector'
import type { ProductData, StrictModeConfig } from '../types'

const strict: StrictModeConfig = {
  origin: true,
  ingredient: true,
  manufacturer: true,
  distributor: true,
  processing: true,
  company_address: true,
  gs1Warning: false,
}

describe('detectMoroccoReference', () => {
  it('rejects when ingredient references Morocco', () => {
    const product: ProductData = {
      gtin: '8411234567890',
      ingredientsText: 'Tomates originario de Marruecos, sal y aceite',
    }

    const result = detectMoroccoReference(product, strict)
    expect(result.decision).toBe('reject')
    expect(result.relationship).toBe('ingredient')
    expect(result.morocco_reference).toBe(true)
  })

  it('returns review for GS1 warning only', () => {
    const product: ProductData = {
      gtin: '6131234567890',
      productName: 'Sample product',
    }

    const result = detectMoroccoReference(product, { ...strict, gs1Warning: true })
    expect(result.decision).toBe('review')
    expect(result.relationship).toBe('gs1')
  })

  it('accepts product without references', () => {
    const product: ProductData = {
      gtin: '8411234567890',
      productName: 'Tomate frito tradicional',
      ingredientsText: 'Tomate, aceite de oliva, sal',
    }

    const result = detectMoroccoReference(product, strict)
    expect(result.decision).toBe('accept')
    expect(result.morocco_reference).toBe(false)
  })

  it('returns review when data is insufficient', () => {
    const result = detectMoroccoReference({ gtin: '8411234567890' }, strict)
    expect(result.decision).toBe('review')
  })
})
