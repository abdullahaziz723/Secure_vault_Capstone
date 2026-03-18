// ═══════════════════════════════════════════════════════════════════
// QRCode.jsx — Real QR Code Generator using qrcode.react
// Generates scannable QR codes for sharing note URLs.
// ═══════════════════════════════════════════════════════════════════

import { QRCodeCanvas } from "qrcode.react";

/**
 * Renders a scannable QR code using qrcode.react library.
 * @param {string} text - The text/URL to encode in the QR code
 * @param {number} size - Size of the QR code in pixels (default: 200)
 * @param {string} level - Error correction level: 'L', 'M', 'Q', 'H' (default: 'M')
 */
export default function QRCode({ text, size = 200, level = "M" }) {
  if (!text) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c1219",
          border: "1px solid #1a2332",
          borderRadius: 8,
          color: "#64748b",
          fontSize: "0.875rem",
        }}
      >
        No data to encode
      </div>
    );
  }

  return (
    <div style={{ display: "inline-block" }}>
      <QRCodeCanvas
        value={text}
        size={size}
        level={level}
        bgColor="#0c1219"
        fgColor="#00d4ff"
        style={{
          borderRadius: 8,
          border: "1px solid #1a2332",
        }}
      />
    </div>
  );
}
