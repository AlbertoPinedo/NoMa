import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function CameraPermission({ denied, onRequest }) {
    return (_jsxs("section", { className: "card permission-card", children: [_jsx("h2", { children: "Camera Access" }), _jsx("p", { children: denied
                    ? 'Camera permission was denied. You can continue with manual EAN-13 input.'
                    : 'Grant camera permission to scan QR/EAN-13 codes live.' }), _jsx("button", { type: "button", onClick: onRequest, children: denied ? 'Try camera again' : 'Allow camera' })] }));
}
