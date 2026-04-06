# Phase 1 Setup & Testing Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install `argon2-browser` and all other dependencies.

### 2. Verify Installation

Check that `argon2-browser` is in `node_modules`:

```bash
ls node_modules/argon2-browser
```

You should see a directory with WebAssembly files.

### 3. Build the Project

```bash
npm run build
```

There should be **no TypeScript errors** related to `argon2-browser` or `@crypto` paths.

## Testing Checklist

### Test 1: Create New Vault (First Time)

1. Start the dev server: `npm run dev`
2. Open http://localhost:5173
3. You should see the "VaultMaster" login screen
4. Enter a master password (minimum 8 characters, mix of upper/lower/numbers/symbols recommended)
5. Confirm the password
6. Click "Create Vault"

**Expected:**
- ✅ Takes 0.5-1 second (this is normal - Argon2id is intentionally slow)
- ✅ Redirects to dashboard
- ✅ No error messages

**What's happening behind the scenes:**
- Password is hashed using Argon2id (64MB memory, 3 iterations, 4 threads)
- Only the hash is stored in localStorage
- Original password is never stored

### Test 2: Verify Storage (No Plaintext)

1. Open browser DevTools (F12)
2. Go to "Application" → "Local Storage" → Your domain
3. Look for `vaultmaster_hash` key

**Expected:**
- ✅ `vaultmaster_hash` exists and contains JSON like:
  ```json
  {
    "hash": "base64string...",
    "salt": "base64string...",
    "params": {
      "memory": 65536,
      "time": 3,
      "parallelism": 4,
      "hashLen": 32,
      "type": 2
    },
    "timestamp": 1234567890
  }
  ```

**Important:**
- ❌ `vaultmaster_pwd` should NOT exist (old plaintext storage)

### Test 3: Login with Correct Password

1. Close the browser or clear session (or just refresh if auto-login doesn't trigger)
2. You should see the login screen again
3. Enter the same password you created
4. Click "Unlock Vault"

**Expected:**
- ✅ Takes 0.5-1 second to verify
- ✅ Redirects to dashboard
- ✅ Your entries are accessible

### Test 4: Login with Wrong Password

1. See login screen
2. Enter a different password
3. Click "Unlock Vault"

**Expected:**
- ✅ Error message: "Invalid master password"
- ✅ Stays on login screen
- ✅ Does NOT proceed to dashboard

### Test 5: Logout Memory Clearing

1. After logging in, check DevTools → Application → Local Storage
2. Note what's stored
3. Click logout button (if available) or close vault
4. Check DevTools again

**Expected:**
- ✅ Auth state is cleared
- ✅ Hash still persists (for next login)
- ✅ Entries are removed from memory

### Test 6: Add Entry and Verify

1. Log in to vault
2. Create a new entry (click "Add New")
3. Fill in password field, title, etc.
4. Save entry

**Expected:**
- ✅ Entry appears in vault grid
- ✅ Password strength indicator shows (based on existing password strength logic)

## Troubleshooting

### Issue: "Cannot find module 'argon2-browser'"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: TypeScript errors about @crypto paths

**Solution:**
- Check `tsconfig.json` has:
  ```json
  "@crypto/*": ["src/crypto/*"]
  ```
- Restart your IDE's TypeScript server (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")

### Issue: "Argon2id hashing failed" error

**Solution:**
- This usually means `argon2-browser` WebAssembly failed to load
- Check browser console (DevTools → Console)
- Make sure you're using a modern browser (Chrome 57+, Firefox 52+, Safari 11+)

### Issue: Login takes 5+ seconds

**This is normal.** Argon2id is supposed to be slow:
- First time setup: 0.5-2s depending on device
- Argon2id with 64MB memory usage takes time by design
- Prevents dictionary attacks

If it's taking unreasonably long (>5s), your device might be under heavy load.

## File Structure Changes

New files created:
```
src/crypto/argon2.ts          # Argon2id KDF implementation
SECURITY_PHASE_1.md           # Detailed security documentation
PHASE_1_SETUP.md              # This file
```

Modified files:
```
src/stores/vaultStore.ts      # Uses Argon2id hashing
src/layouts/AuthLayout.tsx    # References masterPasswordHash
tsconfig.json                 # Added @crypto path alias
package.json                  # Added argon2-browser dependency
```

Unchanged (still secure):
```
src/crypto/index.ts           # AES-256-GCM remains unchanged
```

## What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| Master password storage | Plaintext in localStorage ❌ | Argon2id hash only ✅ |
| KDF algorithm | PBKDF2 (weak) ❌ | Argon2id (strong) ✅ |
| Password comparison | Timing-vulnerable ❌ | Constant-time ✅ |
| Logout memory | Entries persist ❌ | Entries cleared ✅ |

## Performance Expectations

| Operation | Time | Why |
|-----------|------|-----|
| Create vault | 500ms - 2s | Argon2id hashing (intentional) |
| Login | 500ms - 2s | Argon2id verification |
| Add entry | < 100ms | No change from before |
| Search entries | < 50ms | No change from before |

## What's NOT Changed Yet

⏳ **Phase 2** (requires backend):
- SRP (Secure Remote Password) protocol
- Server-side authentication

⏳ **Phase 3** (requires backend + hardware):
- WebAuthn/FIDO2 passkeys
- Biometric authentication

## Next: Production Deployment

Before deploying to production:

1. ✅ Test all scenarios above
2. ✅ Run: `npm run build` (should have zero errors)
3. ✅ Run: `npm run lint` (should have zero warnings about crypto)
4. ✅ Verify localStorage does NOT contain `vaultmaster_pwd`
5. ✅ Test on multiple browsers (Chrome, Firefox, Safari)
6. ✅ Test on mobile devices

## Questions?

See `SECURITY_PHASE_1.md` for detailed technical documentation.
