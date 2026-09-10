import { useCallback, useEffect, useState } from 'react'

export type CameraPermissionState = 'unknown' | 'granted' | 'denied' | 'prompt'

export async function queryCameraPermission(): Promise<CameraPermissionState> {
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
    queryCameraPermission().then(setState)
  }, [])

  const request = useCallback(async () => {
    const permission = await requestCameraPermission()
    setState(permission)
    return permission
  }, [])

  return { state, request, setState }
}

export async function requestCameraPermission(): Promise<'granted' | 'denied'> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    })
    stream.getTracks().forEach((track) => track.stop())
    return 'granted'
  } catch {
    return 'denied'
  }
}
