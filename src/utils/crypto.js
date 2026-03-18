// ═══════════════════════════════════════════════════════════════════
// crypto.js — AES-256-GCM Encryption Engine
// Uses Web Crypto API (browser-native, no dependencies)
// ═══════════════════════════════════════════════════════════════════

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Derives a 256-bit AES key from a password using PBKDF2.
 * @param {string} password - The user password or auto-generated key
 * @param {Uint8Array} salt  - 128-bit random salt
 */
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Output format: base64( salt[16] || iv[12] || ciphertext )
 * @param {string} text     - Plaintext message
 * @param {string} password - Encryption password
 * @returns {Promise<string>} Base64-encoded encrypted blob
 */
export async function encrypt(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const ct   = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));

  const buf = new Uint8Array(16 + 12 + ct.byteLength);
  buf.set(salt, 0);
  buf.set(iv, 16);
  buf.set(new Uint8Array(ct), 28);

  return btoa(String.fromCharCode(...buf));
}

/**
 * Decrypts an AES-256-GCM encrypted blob.
 * @param {string} b64      - Base64-encoded encrypted blob
 * @param {string} password - Decryption password
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decrypt(b64, password) {
  const buf  = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt = buf.slice(0, 16);
  const iv   = buf.slice(16, 28);
  const ct   = buf.slice(28);
  const key  = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(plain);
}

/**
 * Hashes a password with SHA-256 for verification storage.
 * The plaintext password is never persisted.
 * @param {string} p - Password to hash
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function hashPassword(p) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(p));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a cryptographically secure random hex ID.
 * @param {number} len - Byte length (output will be 2x hex chars)
 */
export function genId(len = 24) {
  return [...crypto.getRandomValues(new Uint8Array(len))]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Calculates a password entropy score (0–100).
 * Used to drive the strength meter UI.
 * @param {string} pwd
 * @returns {number}
 */
export function entropyScore(pwd) {
  let score = 0;
  if (!pwd) return 0;
  if (pwd.length >= 8)  score += 20;
  if (pwd.length >= 12) score += 10;
  if (pwd.length >= 16) score += 10;
  if (/[a-z]/.test(pwd))        score += 10;
  if (/[A-Z]/.test(pwd))        score += 15;
  if (/[0-9]/.test(pwd))        score += 15;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
  return Math.min(score, 100);
}
