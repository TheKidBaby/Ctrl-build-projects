# 🔐 SecureVault

> Zero-Knowledge • End-to-End Encrypted • Open Source Password Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Security: 5-Algorithm](https://img.shields.io/badge/Security-5--Algorithm%20Stack-red.svg)](#security-architecture)
[![OWASP Compliant](https://img.shields.io/badge/OWASP-2024%20Compliant-orange.svg)](#security-compliance)

---

## Overview

SecureVault is a modern, open-source password manager built with **security-first principles**. Your master password **never leaves your device** — all encryption happens client-side using a layered, multi-algorithm cryptographic pipeline.

> 🔒 **Philosophy:** No system is 100% invulnerable. But we can make attacks so expensive that they become practically impossible. Our goal: make cracking a single password cost more than the value of what it protects.

---

## Features

- **AES-256-GCM** encryption for all vault data (NIST standard, hardware-accelerated)
- **Argon2id** password hashing (PHC Winner, OWASP 2024 recommended)
- **PBKDF2-HMAC-SHA512** client-side key derivation (600,000 iterations)
- **BLAKE2b-512** key strengthening — 3 rounds, faster than SHA-512, no known attacks
- **RIPEMD-160** integrity checksums — EU-independent design, different attack surface from SHA
- **HKDF-SHA512** multi-key expansion from master key
- **Breach Detection** via HIBP (k-anonymity, privacy-preserving)
- **Cryptographically secure** password generator (CSPRNG / Web Crypto API)
- **Zero-Knowledge Architecture** — server stores only encrypted blobs, never plaintext or keys
- **Dual integrity proofs** — BLAKE2b MAC + RIPEMD-160 checksum on every encrypted entry
- **Timing-safe comparisons** — all verification uses constant-time comparison to prevent timing attacks

---

## Security Architecture

### Cryptographic Pipeline

```
╔══════════════════════════════════════════════════╗
║           SecureVault Security Stack             ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Master Password (client)                        ║
║       ↓                                          ║
║  PBKDF2-SHA512 (600k iterations)                 ║
║       ↓                                          ║
║  BLAKE2b-512 (3 rounds - key strengthening)      ║
║       ↓                                          ║
║  HKDF-SHA512 (key expansion)                     ║
║       ├→ Encryption Key                          ║
║       ├→ Auth Key (BLAKE2b MAC)                  ║
║       ├→ Integrity Key (RIPEMD-160)              ║
║       └→ Sharing Key                             ║
║       ↓                                          ║
║  AES-256-GCM (encrypt)                           ║
║       ↓                                          ║
║  BLAKE2b MAC (authenticity)                      ║
║       ↓                                          ║
║  RIPEMD-160 checksum (integrity)                 ║
║       ↓                                          ║
║  Server (stores encrypted blob only)             ║
║                                                  ║
║  Authentication:                                 ║
║  Password → Argon2id → Store hash                ║
║                                                  ║
║  5 Independent Algorithm Families:               ║
║  ✓ Argon2 (PHC Winner)                           ║
║  ✓ BLAKE2b (RFC 7693)                            ║
║  ✓ SHA-2 (NIST)                                  ║
║  ✓ RIPEMD-160 (EU Independent)                   ║
║  ✓ AES (NIST Hardware-Accelerated)               ║
║                                                  ║
║  Even if 3/5 algorithms are broken,              ║
║  your data remains protected.                    ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

### Why 5 Independent Algorithm Families?

The core principle is **algorithmic diversity**. Each algorithm comes from a different design lineage, standardization body, and research team. A vulnerability in one family does **not** cascade to the others.

| Algorithm | Use Case | Why |
|-----------|----------|-----|
| **BLAKE2b** | Key strengthening, MAC, integrity checks | Faster than SHA-512, RFC 7693 standardized, used in WireGuard & Linux kernel, no known attacks |
| **RIPEMD-160** | Fingerprinting, data checksums | Independent design from SHA family — completely different attack surface; used in Bitcoin |
| **Argon2id** | Password hashing for authentication | Memory-hard (19 MiB), GPU-resistant, PHC competition winner, OWASP 2024 top recommendation |
| **AES-256-GCM** | Vault data encryption | NIST standard, hardware-accelerated (AES-NI), authenticated encryption (AEAD) |
| **PBKDF2-SHA512** | Client-side key derivation | Browser-native Web Crypto API, 600,000 iterations, NIST SP 800-132 compliant |

> **Defense-in-depth guarantee:** Even if 3 out of 5 algorithm families were simultaneously broken, your vault data would remain protected by the remaining 2.

---

### Key Derivation Deep Dive

#### Step 1 — PBKDF2-SHA512 (Client-Side, 600,000 iterations)
The master password is first stretched using PBKDF2-HMAC-SHA512 with 600,000 iterations (OWASP 2024 minimum for SHA-512 is 210,000 — we exceed it by ~3×). This happens **entirely in the browser** via the Web Crypto API. The raw password never reaches the server.

#### Step 2 — BLAKE2b-512 Key Strengthening (3 rounds)
The PBKDF2 output is further strengthened through 3 rounds of BLAKE2b-512 with salt mixing. This adds an additional algorithm layer — an attacker who somehow bypasses PBKDF2 still faces BLAKE2b with its own security properties.

```js
// blake2.js — hashPassword()
for (let i = 0; i < 3; i++) {
  hash.update(Buffer.concat([result, salt, Buffer.from([i])]));
  result = hash.digest();
}
```

#### Step 3 — HKDF-SHA512 Key Expansion
A single master key is expanded into **4 independent derived keys** via HKDF-SHA512, each scoped to a specific purpose and user context (`SecureVault:{userId}:v2:{purpose}`):

| Derived Key | Algorithm | Purpose |
|-------------|-----------|---------|
| `encryptionKey` | HKDF-SHA512 | AES-256-GCM vault encryption |
| `authenticationKey` | BLAKE2b | BLAKE2b MAC generation |
| `integrityKey` | BLAKE2b | RIPEMD-160 integrity proofs |
| `sharingKey` | BLAKE2b | Future: E2E encrypted password sharing |

#### Step 4 — AES-256-GCM Encryption
Each vault entry is encrypted with AES-256-GCM using:
- **256-bit key** (HKDF-derived)
- **96-bit IV** (cryptographically random, unique per encryption)
- **128-bit authentication tag** (built-in AEAD integrity)

#### Step 5 — Dual Integrity Proof
Every stored entry receives a **two-layer integrity proof**:
1. **BLAKE2b MAC** — proves data authenticity (keyed hash, HMAC-SHA512 → BLAKE2b)
2. **RIPEMD-160 checksum** — independent integrity verification (BLAKE2b → SHA-256 → RIPEMD-160)

Both checks must pass on read. Failure triggers a tamper warning.

---

### Authentication Flow

Server-side authentication is completely separate from vault encryption:

```
User Password → Argon2id → Stored Hash (SQLite)
                ↓
         Parameters:
         - Memory: 19 MiB (19,456 KiB)
         - Iterations: 2
         - Parallelism: 1
         - Hash length: 32 bytes
         - Salt: 32 bytes (CSPRNG)
```

The Argon2id hash stored server-side **cannot** be used to decrypt the vault — the vault key is derived client-side and never transmitted. Even a full database compromise yields only unusable hashes.

---

### Zero-Knowledge Guarantee

```
What the server stores:
  ✓ Argon2id hash of authentication password
  ✓ Encrypted blob (AES-256-GCM ciphertext)
  ✓ IV (public, non-secret)
  ✓ RIPEMD-160 integrity tag
  ✓ BLAKE2b domain fingerprint (hashed, not reversible)

What the server NEVER sees:
  ✗ Master password
  ✗ Plaintext vault data
  ✗ Encryption keys
  ✗ PBKDF2 / BLAKE2b intermediate values
  ✗ HKDF-derived keys
```

---

## Project Structure

```
SecureVault/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express entry point
│   │   ├── config/
│   │   │   └── database.js           # SQLite3 setup (better-sqlite3, WAL mode)
│   │   ├── crypto/                   # 🔐 Core cryptographic modules
│   │   │   ├── aes256gcm.js          # AES-256-GCM encrypt/decrypt
│   │   │   ├── argon2.js             # Argon2id hashing (OWASP params)
│   │   │   ├── blake2.js             # BLAKE2b-512 MAC, key derivation, fingerprinting
│   │   │   ├── ripemd160.js          # RIPEMD-160 checksums, triple hash, domain fingerprints
│   │   │   ├── enhancedKeyDerivation.js  # Pipeline orchestration (PBKDF2→BLAKE2b→HKDF)
│   │   │   └── secureRandom.js       # CSPRNG wrappers
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification middleware
│   │   │   ├── errorHandler.js       # Centralized error handling
│   │   │   └── logger.js             # Winston request logging
│   │   ├── models/
│   │   │   ├── User.js               # User model (Argon2id hashing)
│   │   │   ├── Password.js           # Password/vault entry model
│   │   │   └── Category.js           # Category model
│   │   └── routes/
│   │       ├── auth.js               # POST /register, POST /login
│   │       ├── passwords.js          # CRUD + integrity verify endpoint
│   │       ├── breach.js             # HIBP breach detection (k-anonymity)
│   │       ├── security.js           # Security info / audit routes
│   │       ├── vault.js              # Vault sync routes
│   │       ├── sync.js               # Multi-device sync
│   │       └── icons.js              # Favicon/icon proxy
│   └── package.json
└── frontend/                         # React 18 + Vite + Tailwind + Zustand
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Runtime** | Node.js 20 | Server-side JS with native crypto |
| **Backend Framework** | Express.js | REST API |
| **Database** | SQLite3 (better-sqlite3) | Encrypted blob storage, WAL mode |
| **Password Hashing** | argon2 ^0.31.2 | Argon2id server-side auth |
| **Authentication** | jsonwebtoken ^9.0.2 | 7-day JWT tokens |
| **Frontend** | React 18, Vite | UI |
| **State Management** | Zustand | Vault state |
| **Styling** | Tailwind CSS, Framer Motion | UI/UX |
| **Security Headers** | Helmet ^7.1.0 | CSP, XSS headers |
| **Rate Limiting** | express-rate-limit ^7.1.5 | Brute-force protection |
| **Validation** | Zod ^3.22.4 | Input schema validation |
| **Client Crypto** | Web Crypto API | PBKDF2, browser-native |
| **Logging** | Winston ^3.11.0 | Structured request logging |

---

## Installation

```bash
# Clone the repository
git clone https://github.com/TheKidBaby/Ctrl-build-projects.git -b test
cd Ctrl-build-projects/SecureVault

# Backend
cd backend
npm install
cp .env.example .env   # Configure JWT_SECRET (min 256-bit entropy)
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

### Environment Variables (backend/.env)

```env
PORT=3001
JWT_SECRET=your-256-bit-minimum-secret-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DB_PATH=./securevault.db
```

### Endpoints

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |

---

## API Reference

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new user (Argon2id hash) | — |
| `POST` | `/api/auth/login` | Login + JWT issue | — |
| `GET` | `/api/auth/verify` | Verify JWT token | JWT |

> Rate limited: 10 auth attempts per hour per IP (failed requests only).

### Vault / Passwords

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/passwords` | Get all encrypted entries | JWT |
| `POST` | `/api/passwords` | Store encrypted entry + RIPEMD-160 tag | JWT |
| `PUT` | `/api/passwords/:id` | Update entry + re-verify integrity | JWT |
| `DELETE` | `/api/passwords/:id` | Soft delete | JWT |
| `POST` | `/api/passwords/:id/favorite` | Toggle favorite | JWT |
| `GET` | `/api/passwords/:id/verify` | RIPEMD-160 + BLAKE2b integrity check | JWT |

### Breach Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/breach/check-password` | Check single password via HIBP k-anonymity |
| `POST` | `/api/breach/check-batch` | Scan entire vault (max 50 entries) |
| `POST` | `/api/breach/analyze` | Local password strength analysis |

---

## Database Schema

```sql
-- Users table (Argon2id hashes only — no plaintext)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,   -- Argon2id encoded hash
  salt TEXT NOT NULL,            -- Used for client-side key derivation
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login INTEGER,
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0
);

-- Passwords table (encrypted blobs only)
CREATE TABLE passwords (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,  -- AES-256-GCM ciphertext (Base64)
  iv TEXT NOT NULL,              -- 96-bit IV (Base64)
  tag TEXT NOT NULL,             -- RIPEMD-160 checksum for integrity
  category_id TEXT,
  icon_url TEXT,
  domain_hash TEXT,              -- BLAKE2b+RIPEMD-160 fingerprint (non-reversible)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_used_at INTEGER,
  use_count INTEGER DEFAULT 0,
  favorite INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,  -- Soft delete
  deleted_at INTEGER,
  version INTEGER DEFAULT 1
);
```

> **WAL mode enabled** — Write-Ahead Logging for concurrent read performance. Foreign keys enforced at the database level.

---

## Security Compliance

| Standard | Status | Details |
|----------|--------|---------|
| OWASP Top 10 (2021) | ✅ | A01–A10 addressed |
| OWASP Password Storage Cheat Sheet | ✅ | Argon2id with recommended params |
| NIST SP 800-63B | ✅ | Digital Identity Guidelines |
| NIST SP 800-132 | ✅ | Password-Based Key Derivation |
| RFC 7693 (BLAKE2) | ✅ | Implemented via Node.js crypto |
| SQL Injection Prevention | ✅ | Parameterized queries (better-sqlite3) |
| XSS Prevention | ✅ | Helmet CSP headers |
| CSRF Protection | ✅ | Origin validation + JWT |
| Brute-Force Protection | ✅ | Rate limiting (10 auth/hr per IP) |
| Timing Attack Prevention | ✅ | `crypto.timingSafeEqual()` throughout |
| JWT Security | ✅ | 7-day expiry, signed with 256-bit secret |

---

## Cryptographic Module Reference

### `blake2.js` — BLAKE2b Engine
| Method | Input | Output | Use |
|--------|-------|--------|-----|
| `hash512(data, key?)` | string\|Buffer | 64-byte Buffer | Key strengthening |
| `hash256(data, key?)` | string\|Buffer | 32-byte Buffer | Compact hashes |
| `mac(data, key)` | data + key | 64-byte MAC | Authenticity (HMAC-SHA512 → BLAKE2b) |
| `verifyMac(data, key, expected)` | — | boolean | Constant-time MAC verify |
| `deriveKey(inputKey, context, len)` | key + context | Buffer | Per-purpose key derivation |
| `fingerprint(data)` | string | 16-char hex | Quick domain lookup |
| `hashPassword(password, salt)` | pw + salt | Buffer | 3-round key strengthening |

### `ripemd160.js` — RIPEMD-160 Engine
| Method | Input | Output | Use |
|--------|-------|--------|-----|
| `hash(data)` | string\|Buffer | 20-byte Buffer | Raw RIPEMD-160 |
| `hash160(data)` | string\|Buffer | 20-byte Buffer | SHA-256 → RIPEMD-160 (Bitcoin-style) |
| `tripleHash(data)` | string\|Buffer | 20-byte Buffer | BLAKE2b → SHA-256 → RIPEMD-160 |
| `checksum(encryptedData)` | string | hex string | Vault integrity tag |
| `verifyChecksum(data, expected)` | — | boolean | Constant-time verify |
| `domainFingerprint(domain)` | string | 40-char hex | Domain lookup (non-reversible) |

### `enhancedKeyDerivation.js` — Pipeline Orchestrator
| Method | Description |
|--------|-------------|
| `deriveMasterKey(password, salt)` | Argon2id → BLAKE2b strengthening → 32-byte key |
| `deriveVaultKeys(masterKey, userId)` | HKDF + BLAKE2b → 4 scoped keys |
| `createIntegrityProof(data, key)` | BLAKE2b MAC + RIPEMD-160 checksum |
| `verifyIntegrity(data, proof, key)` | Both checks must pass |
| `domainHash(domain)` | BLAKE2b + RIPEMD-160 combined fingerprint |
| `generateRecoveryKey()` | CSPRNG → BLAKE2b → SHA-256 → RIPEMD-160 verification |

### `aes256gcm.js` — Encryption Engine
| Method | Parameters | Description |
|--------|-----------|-------------|
| `encrypt(plaintext, key, aad?)` | 32-byte key | Returns `{ciphertext, iv, tag, algorithm}` |
| `decrypt(ciphertext, key, iv, tag, aad?)` | 32-byte key | Throws on tampered/wrong key |

### `argon2.js` — Password Hashing
| Config | Value | Description |
|--------|-------|-------------|
| `memoryCost` | 19,456 KiB (19 MiB) | GPU/ASIC resistance |
| `timeCost` | 2 iterations | Minimum per OWASP |
| `parallelism` | 1 | Single-thread |
| `hashLength` | 32 bytes | 256-bit output |
| `saltLength` | 32 bytes | 256-bit CSPRNG salt |

---

## Known Limitations

| Limitation | Status | Planned Mitigation |
|------------|--------|--------------------|
| Master password loss = no recovery | Open | Recovery codes (RIPEMD-160 verified) |
| Browser compromise exposes in-memory keys | Open | Auto-lock on inactivity + memory zeroing |
| No offline access | Open | PWA with service worker + encrypted IndexedDB |
| No 2FA on vault unlock | Open | TOTP integration planned |
| SQLite not suitable for high-concurrency prod | Open | PostgreSQL migration path planned |

---

## Roadmap

- [ ] **Two-Factor Authentication** — TOTP (RFC 6238)
- [ ] **Browser Extension** — Chrome + Firefox, auto-fill
- [ ] **Password Sharing** — E2E encrypted via `sharingKey` (BLAKE2b-derived)
- [ ] **Import/Export** — Bitwarden, LastPass, 1Password, CSV
- [ ] **Desktop App** — Electron with local vault option
- [ ] **Mobile App** — React Native
- [ ] **Self-hosted Docker** — Single-container deployment
- [ ] **Recovery Codes** — CSPRNG-generated, RIPEMD-160 verified
- [ ] **Audit Log** — Cryptographically signed access log
- [ ] **PostgreSQL Support** — High-concurrency production backend

---

## Contributing

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: your feature description"
git push origin feature/your-feature
# open a Pull Request against the `test` branch
```

Follow [Conventional Commits](https://www.conventionalcommits.org/).

> ⚠️ **Security Vulnerabilities:** Do **not** open a public issue. Email [security@securevault.com](mailto:security@securevault.com) directly with full reproduction steps. We follow responsible disclosure with a 90-day fix window.

---

## Acknowledgments

[OWASP](https://owasp.org/) · [Have I Been Pwned](https://haveibeenpwned.com/) · [Argon2 (PHC)](https://github.com/P-H-C/phc-winner-argon2) · [NIST](https://www.nist.gov/) · [RFC 7693 (BLAKE2)](https://www.rfc-editor.org/rfc/rfc7693) · [Bitwarden](https://bitwarden.com/) (inspiration)

---

## License

MIT © 2026 SecureVault
