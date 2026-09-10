import axios from 'axios'
import { z } from 'zod'
import type { ProductData } from '../types'

const productSchema = z.object({
  code: z.string().optional(),
  product_name: z.string().optional(),
  generic_name: z.string().optional(),
  ingredients_text: z.string().optional(),
  labels: z.string().optional(),
  brands: z.string().optional(),
  manufacturing_places: z.string().optional(),
  emb_codes_tags: z.array(z.string()).optional(),
  countries: z.string().optional(),
  origins: z.string().optional(),
})

const responseSchema = z.object({
  status: z.number(),
  product: productSchema.optional(),
})

export async function fetchProductByGtin(gtin: string): Promise<ProductData | null> {
  const response = await axios.get(`https://world.openfoodfacts.org/api/v2/product/${gtin}.json`, {
    timeout: 7000,
  })

  const parsed = responseSchema.safeParse(response.data)
  if (!parsed.success || parsed.data.status !== 1 || !parsed.data.product) {
    return null
  }

  const p = parsed.data.product
  return {
    gtin,
    productName: p.product_name,
    description: p.generic_name,
    ingredientsText: p.ingredients_text,
    labelsText: p.labels,
    brands: p.brands,
    manufacturerName: p.manufacturing_places,
    distributorName: p.emb_codes_tags?.join(', '),
    packagingText: p.origins,
    companyAddress: p.emb_codes_tags?.join(', '),
    countries: p.countries,
  }
}
