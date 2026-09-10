export function isIosDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent)
}
