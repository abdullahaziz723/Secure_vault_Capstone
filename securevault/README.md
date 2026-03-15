# 🔐 SecureVault — Secure Secret Note Sharing System
### Final Year Capstone Project · v2.0

---

## Project Overview

SecureVault is a web-based application for securely sharing confidential notes using military-grade encryption. Notes are encrypted **client-side** before any storage occurs, ensuring zero-knowledge architecture where even the server never sees plaintext.

---

## File Structure

```
securevault/
├── index.html                     # App entry point
├── package.json                   # Dependencies (React + Vite)
├── vite.config.js                 # Build configuration
└── src/
    ├── main.jsx                   # React DOM root
    ├── App.jsx                    # Root component + hash router
    │
    ├── utils/
    │   ├── crypto.js              # AES-256-GCM encryption engine
    │   └── store.js               # localStorage persistence layer
    │
    ├── hooks/
    │   └── hooks.js               # useHash, useNotes, useCountdown
    │
    ├── styles/
    │   └── styles.js              # Global CSS (injected via <style>)
    │
    ├── components/
    │   ├── Sidebar.jsx            # Navigation sidebar
    │   ├── Topbar.jsx             # Sticky top bar
    │   ├── AuditEntry.jsx         # Shared audit log row
    │   └── QRCode.jsx             # Canvas-based QR code generator
    │
    └── pages/
        ├── DashboardPage.jsx      # Stats, activity chart, quick actions
        ├── CreatePage.jsx         # 3-tab note creation wizard
        ├── NotesPage.jsx          # Notes manager (filter/search/delete)
        ├── ViewPage.jsx           # Recipient view with brute-force protection
        ├── AuditPage.jsx          # Full system event log
        ├── SecurityPage.jsx       # Cryptographic documentation
        └── SettingsPage.jsx       # App configuration
```

---

## Security Architecture

| Component           | Implementation                          |
|---------------------|-----------------------------------------|
| Encryption          | AES-256-GCM (Web Crypto API)            |
| Key Derivation      | PBKDF2 · SHA-256 · 310,000 iterations  |
| Salt                | 128-bit CSPRNG random per note          |
| IV                  | 96-bit CSPRNG random per encryption     |
| Password Storage    | SHA-256 hash only (plaintext never stored) |
| Key Distribution    | URL fragment (never sent to server)     |
| Self-Destruct       | One-time flag + view-count enforcement  |
| Brute-Force         | 5-attempt lockout per note              |
| Expiry              | Configurable TTL (30m – 7d)             |

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Production Deployment (Flask/MongoDB)

The frontend cryptography is complete. For the backend:

1. **Flask API** — endpoints for storing/retrieving encrypted blobs
2. **MongoDB** — store `{ id, encrypted_blob, pw_hash, metadata }`
3. **Flask-Talisman** — security headers (HSTS, CSP, X-Frame-Options)
4. **JWT** — session management for authenticated users
5. **TLS 1.3** — transport encryption

The frontend only ever sends the **encrypted ciphertext** to the backend.  
The decryption key stays in the browser (URL fragment or user password).

---

## Academic References

- NIST SP 800-38D — AES-GCM specification
- NIST SP 800-132 — PBKDF2 recommendations
- RFC 8018 — PKCS #5 Password-Based Cryptography
- OWASP Cryptographic Storage Cheat Sheet
