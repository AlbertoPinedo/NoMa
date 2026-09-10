import { useCallback, useEffect, useState } from 'react'

export type CameraPermissionState = 'unknown' | 'granted' | 'denied' | 'prompt'

async function queryPermission(): Promise<CameraPermissionState> {
  if (typeof navigator === 'undefined' || !navigator.permissions) return 'unknown'

  try {
    const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
    return status.state
  } catch {
    return 'unknown'
  }
}

export function useCameraPermission() {
  const [state, setState] = useState<CameraPermissionState>('unknown')

  useEffect(() => {
    queryPermission().then(setState)
  }, [])

  const request = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      stream.getTracks().forEach((track) => track.stop())
      setState('granted')
      return 'granted' as const
    } catch {
      setState('denied')
      return 'denied' as const
    }
  }, [])

  return { state, request, setState }
}

export function normalizeScannedCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 13)
}

export function isIosDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent)
}
