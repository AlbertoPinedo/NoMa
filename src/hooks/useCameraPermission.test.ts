import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryCameraPermission, requestCameraPermission } from './useCameraPermission'

describe('useCameraPermission helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns unknown when permission API is unavailable', async () => {
    vi.stubGlobal('navigator', { permissions: undefined })
    await expect(queryCameraPermission()).resolves.toBe('unknown')
  })

  it('returns granted when getUserMedia succeeds', async () => {
    const stop = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop }],
    })

    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia },
    })

    await expect(requestCameraPermission()).resolves.toBe('granted')
    expect(stop).toHaveBeenCalledOnce()
  })

  it('returns denied when getUserMedia fails', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia },
    })

    await expect(requestCameraPermission()).resolves.toBe('denied')
  })
})
