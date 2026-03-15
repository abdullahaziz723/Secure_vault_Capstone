// ═══════════════════════════════════════════════════════════════════
// QRCode.jsx — Pure-canvas QR Code Visual Generator
// No third-party library needed. Generates a visually distinct
// QR-style pattern seeded from the URL content.
// ═══════════════════════════════════════════════════════════════════

import { useRef, useEffect } from "react";

/**
 * Renders a QR-code-style canvas element.
 * In a production app, replace with a real QR library (e.g. qrcode.react).
 */
export default function QRCode({ text, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const N = 25;
    canvas.width = size;
    canvas.height = size;
    const cell = size / N;

    // Background
    ctx.fillStyle = "#0c1219";
    ctx.fillRect(0, 0, size, size);

    // Seed deterministic pattern from URL text
    const hash = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
    const seeded = (x, y) =>
      Math.abs(Math.sin(hash + x * 17 + y * 31 + x * y * 7)) > 0.45;

    // Draw finder patterns (top-left, top-right, bottom-left)
    const drawFinder = (sx, sy) => {
      ctx.fillStyle = "#00d4ff";
      ctx.fillRect(sx * cell, sy * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = "#0c1219";
      ctx.fillRect((sx + 1) * cell, (sy + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = "#00d4ff";
      ctx.fillRect((sx + 2) * cell, (sy + 2) * cell, 3 * cell, 3 * cell);
    };
    drawFinder(0, 0);
    drawFinder(N - 7, 0);
    drawFinder(0, N - 7);

    // Data modules (skip finder zones)
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const inFinder =
          (x < 8 && y < 8) ||
          (x >= N - 8 && y < 8) ||
          (x < 8 && y >= N - 8);
        if (!inFinder && seeded(x, y)) {
          ctx.fillStyle = "#00d4ff";
          ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
        }
      }
    }
  }, [text, size]);

  return (
    <canvas
      ref={canvasRef}
      className="qr-canvas"
      style={{ width: size, height: size }}
    />
  );
}
