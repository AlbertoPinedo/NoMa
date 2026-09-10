import { describe, expect, it } from 'vitest'
import { isIosDevice, normalizeScannedCode } from './useCameraPermission'

describe('mobile helper utilities', () => {
  it('normalizes scanned values to 13 digits max', () => {
    expect(normalizeScannedCode('EAN: 8411234567890')).toBe('8411234567890')
    expect(normalizeScannedCode('12345678901234')).toBe('1234567890123')
  })

  it('detects iOS user agents', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true)
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14; Pixel)')).toBe(false)
  })
})
