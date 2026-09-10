import { describe, expect, it } from 'vitest'
import { isIosDevice } from './mobile'

describe('mobile utilities', () => {
  it('detects iOS user agents', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true)
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14; Pixel)')).toBe(false)
  })
})
