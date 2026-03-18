# 🔐 SecureVault — Secure Secret Note Sharing System
### Final Year Capstone Project · v2.0

---

## Project Overview

SecureVault is a web-based application for securely sharing confidential notes using military-grade encryption. Notes are encrypted **client-side** before any storage occurs, ensuring zero-knowledge architecture where even the server never sees plaintext. The system incorporates a tamper-evident blockchain audit ledger to log all sensitive actions, providing immutable proof of integrity and non-repudiation.

This project demonstrates advanced concepts in cryptography, blockchain technology, and secure web application development, making it ideal for a capstone presentation on modern security practices in distributed systems.

---

## Main Features

### 🔒 **End-to-End Encryption**
- **Client-Side Encryption**: All notes are encrypted in the browser using AES-256-GCM before transmission
- **Zero-Knowledge Architecture**: Server never sees plaintext; only encrypted blobs are stored
- **Password-Based Key Derivation**: PBKDF2 with 310,000 iterations for strong key generation
- **Cryptographically Secure Randomness**: CSPRNG for salts and initialization vectors

### ⛓️ **Blockchain Audit Ledger**
- **Tamper-Evident Logging**: Every action (create, view, delete) is recorded in an immutable blockchain
- **Proof-of-Work Consensus**: Demonstrates mining concepts with adjustable difficulty
- **Merkle Tree Integration**: Efficient verification of transaction integrity
- **SHA-256 Hashing**: Consistent with Bitcoin's cryptographic primitives

### 🛡️ **Security Features**
- **Brute-Force Protection**: 5-attempt lockout per note with progressive delays
- **Self-Destruct Mechanism**: One-time view flags and configurable expiration (30min - 7days)
- **URL Fragment Key Distribution**: Encryption keys never sent to server
- **Password Strength Meter**: Real-time entropy calculation and visual feedback

### 📱 **User Interface & Workflow**
- **Responsive Design**: Mobile-first approach with collapsible sidebar navigation
- **Multi-Step Note Creation**: 3-tab wizard for note composition, security settings, and sharing
- **Real-Time Search & Filtering**: Advanced note management with metadata filtering
- **QR Code Generation**: Canvas-based QR codes for easy mobile sharing
- **Dashboard Analytics**: Activity charts and system statistics

### 🔍 **Audit & Transparency**
- **Comprehensive Event Logging**: Full audit trail of all system activities
- **Blockchain Explorer**: Visual interface for inspecting the audit chain
- **Integrity Verification**: Automatic detection of chain tampering
- **Export Capabilities**: JSON export of audit logs for compliance

---

## Architecture & Structure

### Frontend Architecture
SecureVault follows a component-based architecture using React with modern hooks for state management. The application is built with Vite for fast development and optimized production builds.

```
securevault/
├── index.html                     # App entry point with basic HTML structure
├── package.json                   # Project metadata and dependencies
├── vite.config.js                 # Vite build configuration
└── src/
    ├── main.jsx                   # React application bootstrap
    ├── App.jsx                    # Root component with routing logic
    │
    ├── utils/                     # Core business logic utilities
    │   ├── crypto.js              # AES-256-GCM encryption engine
    │   ├── blockchain.js          # Blockchain audit ledger implementation
    │   └── store.js               # localStorage persistence layer
    │
    ├── hooks/                     # Custom React hooks
    │   └── hooks.js               # useHash, useNotes, useCountdown
    │
    ├── styles/                    # Styling (CSS-in-JS approach)
    │   └── styles.js              # Global styles and component styles
    │
    ├── components/                # Reusable UI components
    │   ├── Sidebar.jsx            # Navigation sidebar with route handling
    │   ├── Topbar.jsx             # Application header with branding
    │   ├── AuditEntry.jsx         # Audit log entry component
    │   └── QRCode.jsx             # QR code generation component
    │
    └── pages/                     # Page-level components
        ├── DashboardPage.jsx      # Main dashboard with stats
        ├── CreatePage.jsx         # Note creation wizard
        ├── NotesPage.jsx          # Note management interface
        ├── ViewPage.jsx           # Note viewing interface
        ├── AuditPage.jsx          # Audit log viewer
        ├── BlockchainPage.jsx     # Blockchain explorer
        ├── SecurityPage.jsx       # Security documentation
        └── SettingsPage.jsx       # Application settings
```

### Data Flow & State Management
- **Local State**: React useState hooks for component-level state
- **Persistent Storage**: localStorage for note and audit data
- **URL-Based Routing**: Hash-based routing for shareable note URLs
- **Event-Driven Updates**: Custom hooks for reactive data updates

### Security Architecture

| Component           | Implementation                          | Purpose |
|---------------------|-----------------------------------------|---------|
| Encryption          | AES-256-GCM (Web Crypto API)            | Symmetric encryption of note content |
| Key Derivation      | PBKDF2 · SHA-256 · 310,000 iterations  | Password-to-key transformation |
| Salt                | 128-bit CSPRNG random per note          | Prevents rainbow table attacks |
| IV                  | 96-bit CSPRNG random per encryption     | Ensures unique ciphertexts |
| Password Storage    | SHA-256 hash only (plaintext never stored) | Verification without storage |
| Key Distribution    | URL fragment (never sent to server)     | Secure key sharing |
| Self-Destruct       | One-time flag + view-count enforcement  | Ephemeral content |
| Brute-Force         | 5-attempt lockout per note              | Attack prevention |
| Expiry              | Configurable TTL (30m – 7d)             | Time-limited access |

---

## Key Code Snippets

### Encryption & Hashing (`src/utils/crypto.js`)

#### AES-256-GCM Encryption
```javascript
/**
 * Encrypts plaintext using AES-256-GCM.
 * Output format: base64( salt[16] || iv[12] || ciphertext )
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
```

#### PBKDF2 Key Derivation
```javascript
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
```

#### Password Hashing for Verification
```javascript
export async function hashPassword(p) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(p));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
```

### Blockchain Implementation (`src/utils/blockchain.js`)

#### SHA-256 Hashing
```javascript
export async function sha256(data) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

#### Merkle Root Calculation
```javascript
export async function computeMerkleRoot(txs) {
  if (txs.length === 0) return await sha256("empty");

  let hashes = await Promise.all(
    txs.map((tx) => sha256(JSON.stringify(tx)))
  );

  while (hashes.length > 1) {
    const next = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left  = hashes[i];
      const right = hashes[i + 1] || left;
      next.push(await sha256(left + right));
    }
    hashes = next;
  }

  return hashes[0];
}
```

#### Proof-of-Work Mining
```javascript
export async function mineBlock(index, timestamp, transactions, previousHash) {
  let nonce = 0;
  let hash = "";

  while (!hash.startsWith("0".repeat(DIFFICULTY))) {
    const blockData = JSON.stringify({
      index, timestamp, transactions, previousHash, nonce
    });
    hash = await sha256(blockData);
    nonce++;
  }

  return { nonce, hash };
}
```

### Frontend Workflow (`src/App.jsx`)

#### Hash-Based Routing
```javascript
useEffect(() => {
  if (hash.startsWith("#/note/")) {
    const parts = hash.replace("#/note/", "").split("?");
    setNoteId(parts[0]);
    setPage("view");
  } else if (hash.startsWith("#/page/")) {
    setPage(hash.replace("#/page/", ""));
  } else {
    setPage("dashboard");
  }
}, [hash]);
```

#### State Management with Custom Hooks
```javascript
const hash                          = useHash();
const [page, setPage]               = useState("dashboard");
const [noteId, setNoteId]           = useState(null);
const [notes, refreshNotes]         = useNotes();
const [audit, setAudit]             = useState([]);
const [chainReady, setChainReady]   = useState(false);
```

---

## Frontend Workflow

### 1. Application Initialization
- **Bootstrap**: `main.jsx` renders `App.jsx` as root component
- **Styling Injection**: Global CSS injected via `<style>` tag
- **Blockchain Init**: Audit chain initialized from localStorage
- **State Setup**: React hooks establish reactive state management

### 2. User Interaction Flow
- **Navigation**: Sidebar clicks update `page` state, triggering route changes
- **Note Creation**: 3-step wizard collects content, security settings, and generates shareable URL
- **Encryption**: Content encrypted client-side before localStorage persistence
- **Audit Logging**: Every action recorded as blockchain transaction

### 3. Note Sharing Process
- **URL Generation**: Note ID + encryption key combined in hash fragment
- **QR Code**: Canvas rendering for mobile sharing
- **Recipient Access**: URL parsing extracts note ID and decryption key
- **Security Checks**: Brute-force protection and expiration validation

### 4. Audit & Verification
- **Chain Inspection**: Merkle root verification ensures integrity
- **Tamper Detection**: Hash chain validation detects any modifications
- **Export Functionality**: JSON serialization for external analysis

---

## Presentation Aspects

### Technical Highlights for Capstone Defense

#### 1. **Cryptographic Implementation**
- Demonstrate Web Crypto API usage for production-ready encryption
- Explain zero-knowledge architecture benefits
- Show entropy calculation and password strength assessment

#### 2. **Blockchain Concepts**
- Illustrate proof-of-work mining process
- Explain Merkle tree efficiency for transaction verification
- Demonstrate immutability through hash chain validation

#### 3. **Security Best Practices**
- Client-side encryption prevents server-side breaches
- Brute-force protection implementation
- Secure key distribution via URL fragments

#### 4. **Modern Web Development**
- React hooks for clean state management
- Component-based architecture benefits
- Vite for optimized build performance

#### 5. **User Experience Design**
- Responsive design principles
- Progressive enhancement approach
- Accessibility considerations in UI components

### Demo Scenarios
1. **Note Creation**: Show encryption process and URL generation
2. **Secure Sharing**: Demonstrate QR code sharing and recipient decryption
3. **Audit Verification**: Display blockchain integrity and tamper detection
4. **Security Features**: Test brute-force protection and expiration

### Learning Outcomes
- Applied cryptography in web applications
- Blockchain fundamentals beyond cryptocurrencies
- Secure software development practices
- Modern JavaScript and React patterns

---

## Getting Started

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production
```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

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
- Bitcoin Whitepaper — Proof-of-Work consensus
- Ethereum Yellow Paper — Merkle tree applications

---

## Future Enhancements

- **Multi-Device Sync**: Cloud storage integration with end-to-end encryption
- **Collaborative Editing**: Real-time shared note editing with conflict resolution
- **Advanced Auditing**: Integration with external logging systems
- **Mobile App**: React Native implementation for native mobile experience
- **Hardware Security**: Integration with hardware security modules (HSM)

---

*This project demonstrates the practical application of advanced cryptographic and blockchain concepts in a user-friendly web application, suitable for secure communication in enterprise and personal use cases.*
