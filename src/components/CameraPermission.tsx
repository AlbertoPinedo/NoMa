interface CameraPermissionProps {
  denied: boolean
  onRequest: () => void
}

export function CameraPermission({ denied, onRequest }: CameraPermissionProps) {
  return (
    <section className="card permission-card">
      <h2>Camera Access</h2>
      <p>
        {denied
          ? 'Camera permission was denied. You can continue with manual EAN-13 input.'
          : 'Grant camera permission to scan QR/EAN-13 codes live.'}
      </p>
      <button type="button" onClick={onRequest}>
        {denied ? 'Try camera again' : 'Allow camera'}
      </button>
    </section>
  )
}
