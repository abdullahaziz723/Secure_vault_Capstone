// ═══════════════════════════════════════════════════════════════════
// SecurityPage.jsx — Cryptographic Implementation Documentation
// Suitable for capstone report / viva presentation
// ═══════════════════════════════════════════════════════════════════

const SECTIONS = [
  {
    icon: "🔐",
    title: "AES-256-GCM Encryption",
    content:
      "All notes are encrypted using AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode). This algorithm provides both confidentiality and data authenticity. The 256-bit key length makes brute-force attacks computationally infeasible. GCM mode appends a 128-bit authentication tag that detects any tampering with the ciphertext.",
    specs: [
      ["Algorithm",  "AES-256-GCM"],
      ["Key size",   "256 bits"],
      ["IV size",    "96 bits (random per message)"],
      ["Tag size",   "128 bits (authentication)"],
    ],
  },
  {
    icon: "🔑",
    title: "PBKDF2 Key Derivation",
    content:
      "Passwords are never used directly as encryption keys. PBKDF2 (Password-Based Key Derivation Function 2) with SHA-256 derives a strong cryptographic key from the password. 310,000 iterations with a random 128-bit salt make brute-force and dictionary attacks computationally expensive — well above NIST SP 800-132 recommendations.",
    specs: [
      ["Function",    "PBKDF2"],
      ["Hash",        "SHA-256"],
      ["Iterations",  "310,000"],
      ["Salt",        "128-bit random"],
    ],
  },
  {
    icon: "🛡️",
    title: "Zero-Knowledge Architecture",
    content:
      "In password-free mode, the decryption key is embedded in the URL fragment (#). URL fragments are never sent to any server — they exist only in the user's browser. In password mode, the password is hashed (SHA-256) for verification but the plaintext is never stored. The encrypted ciphertext alone is useless without the key.",
    specs: [
      ["Key storage",      "URL fragment only"],
      ["Password storage", "SHA-256 hash only"],
      ["Server access",    "None (browser-only)"],
      ["Data at rest",     "Encrypted ciphertext"],
    ],
  },
  {
    icon: "💣",
    title: "Self-Destruct Mechanism",
    content:
      "One-time notes are flagged as 'viewed' immediately on first reveal. Subsequent access attempts are denied. Time-based expiry compares the creation timestamp with the configured TTL on every access attempt. Expired notes are deleted immediately. The configurable max-view-count supports controlled multi-access scenarios.",
    specs: [
      ["One-time",    "Destroyed after 1st view"],
      ["Expiry",      "Configurable (30m – 7d)"],
      ["Max views",   "1–100 configurable"],
      ["Brute-force", "Locked after 5 attempts"],
    ],
  },
  {
    icon: "🌐",
    title: "Attack Surface Mitigations",
    content:
      "Brute-force on passwords is mitigated by PBKDF2 key stretching combined with a 5-attempt client lockout. Man-in-the-middle attacks are countered because decryption occurs entirely client-side. GCM authentication tags prevent ciphertext tampering (CCA2 security). URL fragment keys are never transmitted to or logged by a server.",
    specs: [
      ["Brute force", "PBKDF2 + lockout"],
      ["MITM",        "Client-side decrypt"],
      ["Tampering",   "GCM auth tag (CCA2)"],
      ["Replay",      "One-time + expiry"],
    ],
  },
  {
    icon: "🏗️",
    title: "Full-Stack Architecture",
    content:
      "SecureVault uses React + Web Crypto API for client-side cryptography. This demo uses localStorage. In the production Flask/MongoDB deployment: the backend stores only encrypted blobs and hashed passwords, JWT handles session management, Flask-Talisman sets security headers (HSTS, CSP, X-Frame-Options), and TLS 1.3 secures transport.",
    specs: [
      ["Frontend",   "React + Web Crypto API"],
      ["Storage",    "localStorage / MongoDB"],
      ["Backend",    "Python Flask (production)"],
      ["Transport",  "TLS 1.3"],
    ],
  },
];

export default function SecurityPage() {
  return (
    <div className="fade-in">
      <div className="alert alert-info mb-3">
        <span className="alert-icon">ℹ️</span>
        This page documents the cryptographic implementation and security architecture of SecureVault for academic and audit purposes.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {SECTIONS.map((s) => (
          <div key={s.title} className="card">
            <div className="card-header">
              <span className="card-title">{s.icon} {s.title}</span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: ".82rem", color: "var(--muted2)", lineHeight: 1.75, marginBottom: "1rem" }}>
                {s.content}
              </p>
              <div className="grid-2">
                {s.specs.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: ".45rem .75rem", background: "var(--s2)", borderRadius: 6, fontSize: ".75rem" }}>
                    <span style={{ color: "var(--muted)" }}>{k}</span>
                    <span style={{ color: "var(--c1)", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
