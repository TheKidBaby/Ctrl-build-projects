# 🔐 SecureVault

> Zero-Knowledge • End-to-End Encrypted • Open Source Password Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

---

## Overview

SecureVault is a modern, open-source password manager built with security-first principles. Your master password never leaves your device — all encryption happens client-side.

---

## Features

- **AES-256-GCM** encryption for all vault data
- **Argon2id** password hashing (OWASP 2024 recommended)
- **PBKDF2-HMAC-SHA512** client-side key derivation (600,000 iterations)
- **HKDF** multi-key derivation from master key
- **Breach Detection** via HIBP (k-anonymity, privacy-preserving)
- **Cryptographically secure** password generator (Web Crypto API)
- **Zero-Knowledge Architecture** — server stores only encrypted blobs

---

## Security Architecture

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

| Component | Algorithm | Parameters |
|-----------|-----------|------------|
| Password Storage | Argon2id | 19 MiB memory, 2 iterations, parallelism 1 |
| Key Derivation | PBKDF2-HMAC-SHA512 | 600,000 iterations |
| Data Encryption | AES-256-GCM | 256-bit key, 96-bit IV, 128-bit tag |
| Key Expansion | HKDF-SHA512 | Multiple derived keys |
| Random Generation | CSPRNG | OS-level secure random |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js 20, Express.js, SQLite3, Argon2, JWT |
| Frontend | React 18, Vite, Zustand, Tailwind CSS, Framer Motion |
| Security | Helmet, express-rate-limit, Zod, Web Crypto API |

---

## Installation

```bash
# Clone
git clone https://github.com/yourusername/SecureVault.git
cd SecureVault

# Backend
cd backend
npm install
cp .env.example .env   # Set JWT_SECRET
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:3001  
- Health Check: http://localhost:3001/health

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/verify` | Verify JWT token |

### Passwords
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/passwords` | Get all passwords |
| POST | `/api/passwords` | Create password |
| PUT | `/api/passwords/:id` | Update password |
| DELETE | `/api/passwords/:id` | Delete password |
| POST | `/api/passwords/:id/favorite` | Toggle favorite |

### Breach Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/breach/check-password` | Check single password |
| POST | `/api/breach/check-batch` | Scan entire vault (max 50) |
| POST | `/api/breach/analyze` | Local strength analysis |

---

## Security Compliance

- ✅ OWASP Top 10 (2021)
- ✅ OWASP Password Storage Cheat Sheet
- ✅ NIST SP 800-63B — Digital Identity Guidelines
- ✅ NIST SP 800-132 — Password-Based Key Derivation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (CSP headers)
- ✅ CSRF protection
- ✅ Rate limiting (5 login attempts/hour)
- ✅ JWT with expiration (7-day)

---

## Known Limitations

| Limitation | Mitigation |
|------------|------------|
| Master password loss = no recovery | Recovery codes planned |
| Browser compromise exposes in-memory data | Auto-lock on inactivity planned |
| No offline access | PWA with service worker planned |

---

## Roadmap

- [ ] Two-Factor Authentication (TOTP)
- [ ] Browser Extension (Chrome, Firefox)
- [ ] Password Sharing (E2E encrypted)
- [ ] Import/Export (Bitwarden, LastPass, CSV)
- [ ] Desktop & Mobile apps (Electron / React Native)
- [ ] Self-hosted Docker deployment

---

## Contributing

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: your feature description"
git push origin feature/your-feature
# open a Pull Request
```

Follow [Conventional Commits](https://www.conventionalcommits.org/). For security vulnerabilities, do **not** open a public issue — email security@securevault.com directly.

---

## Acknowledgments

[OWASP](https://owasp.org/) · [Have I Been Pwned](https://haveibeenpwned.com/) · [Argon2](https://github.com/P-H-C/phc-winner-argon2) · [NIST](https://www.nist.gov/) · [Bitwarden](https://bitwarden.com/) (inspiration)

---

## License

MIT © 2026 SecureVault
