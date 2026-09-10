import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
export function Scanner({ open, onDetected, onClose }) {
    const scannerRef = useRef(null);
    const [detectedCode, setDetectedCode] = useState('');
    const [torchEnabled, setTorchEnabled] = useState(false);
    const [torchAvailable, setTorchAvailable] = useState(false);
    const regionId = useMemo(() => `scanner-region-${Math.random().toString(36).slice(2)}`, []);
    useEffect(() => {
        if (!open)
            return;
        let cancelled = false;
        const scanner = new Html5Qrcode(regionId, {
            verbose: false,
            formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.QR_CODE],
        });
        scannerRef.current = scanner;
        scanner
            .start({ facingMode: 'environment' }, {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                const side = Math.min(viewfinderWidth, viewfinderHeight) * 0.8;
                return { width: side, height: side };
            },
        }, (decodedText) => {
            if (cancelled)
                return;
            setDetectedCode(decodedText);
            void scanner.stop().finally(() => {
                onDetected(decodedText);
                onClose();
            });
        }, () => undefined)
            .then(() => {
            const capabilities = scanner.getRunningTrackCapabilities();
            setTorchAvailable(Boolean(capabilities?.torchFeature?.supported));
        })
            .catch(() => {
            onClose();
        });
        return () => {
            cancelled = true;
            const current = scannerRef.current;
            if (!current)
                return;
            if (current.isScanning) {
                void current.stop().finally(() => void current.clear());
            }
            else {
                void current.clear();
            }
        };
    }, [open, onClose, onDetected, regionId]);
    async function toggleTorch() {
        const scanner = scannerRef.current;
        if (!scanner)
            return;
        const nextState = !torchEnabled;
        try {
            await scanner.applyVideoConstraints({
                advanced: [{ torch: nextState }],
            });
            setTorchEnabled(nextState);
        }
        catch {
            setTorchAvailable(false);
        }
    }
    if (!open)
        return null;
    return (_jsxs("div", { className: "scanner-sheet", role: "dialog", "aria-modal": "true", children: [_jsxs("div", { className: "scanner-header", children: [_jsx("h2", { children: "Scan barcode" }), _jsx("button", { type: "button", onClick: onClose, className: "ghost-button", children: "Close" })] }), _jsxs("div", { className: "scanner-frame", children: [_jsx("div", { id: regionId, className: "scanner-region" }), _jsx("div", { className: "scanner-overlay" })] }), _jsxs("div", { className: "scanner-actions", children: [_jsx("button", { type: "button", onClick: toggleTorch, disabled: !torchAvailable, children: torchEnabled ? 'Torch off' : 'Torch on' }), detectedCode ? _jsxs("p", { className: "detected", children: ["Detected: ", detectedCode] }) : _jsx("p", { children: "Point camera at QR or EAN-13." })] })] }));
}
