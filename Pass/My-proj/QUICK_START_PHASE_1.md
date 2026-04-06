# Phase 1 Quick Start - 5 Minutes

## 1. Install (30 seconds)
```bash
npm install
```

## 2. Build (30 seconds)
```bash
npm run build
```
✅ Should have zero TypeScript errors.

## 3. Test (2 minutes)

### Start server:
```bash
npm run dev
```

### Test workflow:
1. **Create vault**: Set master password → Takes 0.5-2s (this is normal!) → Dashboard
2. **Check storage**: DevTools → Application → Local Storage
   - ✅ Should see `vaultmaster_hash` (not `vaultmaster_pwd`)
3. **Login**: Refresh browser → Enter password → Verify success
4. **Wrong password**: Try different password → Should get error

## What Changed?

| What | Before | After |
|------|--------|-------|
| Master password | Plaintext 😱 | Hashed with Argon2id ✅ |
| KDF | PBKDF2 | Argon2id (64MB) ✅ |
| Speed | Instant | 0.5-2s (intentional) ✅ |

## Common Issues

**"Cannot find module 'argon2-browser'"**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**"Login takes too long"**
- This is correct! Argon2id is slow by design (prevents attacks)
- 0.5-2 seconds is normal

**"TypeError: Cannot read property 'hash' of null"**
- First time users should see login screen
- If you see this, localStorage might be corrupted
- Clear localStorage and try again

## Verify It Works

Open DevTools Console and run:
```javascript
// Should show hash object (not password string!)
JSON.parse(localStorage.getItem('vaultmaster_hash'))
```

Should output something like:
```json
{
  "hash": "base64...",
  "salt": "base64...",
  "params": { "memory": 65536, "time": 3, "parallelism": 4, ... }
}
```

## Next Steps

✅ **Just deployed?** → Run the 3 tests above  
📖 **Want details?** → See `SECURITY_PHASE_1.md`  
🧪 **Full test suite?** → See `PHASE_1_SETUP.md`  

---

**That's it!** You're now running Phase 1 security hardening. 🎉