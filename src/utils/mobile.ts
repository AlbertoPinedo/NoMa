export function normalizeScannedCode(value: string): string {
  return value.replace(/\D/g, '')
}

export function isIosDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent)
}
