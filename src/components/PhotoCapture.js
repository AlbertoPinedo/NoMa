import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export function PhotoCapture({ file, onFileChange }) {
    const [previewUrl, setPreviewUrl] = useState('');
    useEffect(() => {
        if (!file) {
            setPreviewUrl('');
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    if (!file) {
        return (_jsx("div", { className: "photo-capture", children: _jsxs("label", { className: "shutter", children: [_jsx("input", { type: "file", accept: "image/*", capture: "environment", onChange: (event) => onFileChange(event.target.files?.[0] ?? null) }), _jsx("span", { "aria-hidden": "true" }), "Take photo for OCR"] }) }));
    }
    return (_jsxs("div", { className: "photo-preview", children: [_jsx("img", { src: previewUrl, alt: "Photo preview for OCR" }), _jsxs("div", { className: "preview-actions", children: [_jsx("button", { type: "button", onClick: () => onFileChange(null), className: "ghost-button", children: "Cancel photo" }), _jsxs("label", { children: ["Retry photo", _jsx("input", { type: "file", accept: "image/*", capture: "environment", onChange: (event) => onFileChange(event.target.files?.[0] ?? null) })] })] })] }));
}
