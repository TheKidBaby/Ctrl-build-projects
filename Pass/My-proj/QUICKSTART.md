# VaultMaster - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git** (optional, for cloning)

Check your versions:
```bash
node --version
npm --version
```

---

## ⚡ Installation

### 1. Navigate to Project
```bash
cd Pass/My-proj
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

This installs all required packages (~456 packages, ~30 seconds).

---

## 🎯 Running the Application

### Development Mode (Recommended for Testing)
```bash
npm run dev
```

**What happens:**
- Dev server starts at `http://localhost:5173`
- Browser opens automatically
- Hot reload enabled (changes appear instantly)
- Source maps available for debugging

**You should see:**
```
VITE v5.4.21  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Production Build
```bash
npm run build
```

**Output:**
- Creates `dist/` folder with optimized code
- ~66 KB total (gzipped)
- Ready to deploy

### Preview Production Build
```bash
npm run build
npm run preview
```

Opens production build at `http://localhost:4173/`

---

## 📝 First Time Setup

### Step 1: Create Master Password
1. **Open the app** (it loads to authentication screen)
2. **Enter a strong password** (minimum 8 characters)
3. **Watch the strength indicator** change colors
   - Red = Weak
   - Yellow = Fair
   - Green = Strong
4. **Confirm password** in second field
5. **Click "Create Vault"**

### Step 2: Enter Dashboard
1. Vault created and unlocked
2. See empty dashboard with "Add passwords" prompt
3. Notice categories in left sidebar
4. Explore the interface

### Step 3: Create First Entry
1. **Click "New" button** (top right)
2. **Fill entry form:**
   - **Title**: "Gmail Account" (or any service name)
   - **Category**: "Email" or "Login"
   - **Username**: your email or username
   - **Password**: Create one or use generator
   - **Website**: Optional URL
   - **Notes**: Any extra info
   - **Tags**: Optional labels
3. **Click password generator** (🔄 icon) to auto-generate
4. **Click "Create Entry"**
5. Entry appears in grid

---

## 💡 Key Features

### 🔍 Search & Filter
- **Search bar** (top): Type to search by title, username, or URL
- **Sidebar categories**: Click to filter by type
- **Favorites**: See "Favorites" in sidebar for quick access

### 👁️ View Password
1. Click on entry card to expand
2. Password shows as dots (••••••••)
3. **Click "Show"** to reveal password
4. **Click "Copy"** to copy to clipboard (shows "Copied!" for 2 seconds)

### ⭐ Favorite Entry
1. Hover over entry card
2. Click star icon (top right)
3. Entry appears in "Favorites" category

### ✏️ Edit Entry
1. Expand entry (click card)
2. **Click "Edit"** button (bottom)
3. Modify fields
4. **Click "Save"** (or "Update")

### 🗑️ Delete Entry
1. Expand entry
2. **Click "Delete"** button
3. Confirm in dialog
4. Entry removed permanently

### 📊 Password Generator
1. **Click "New"** button
2. Scroll to password field
3. **Click generator icon** (🔄)
4. Random 16-character password generated
5. Strength shown in real-time

### 📥 Import Passwords
1. **Click sidebar "Import"** button
2. Select JSON file (from export or other manager)
3. All entries imported and encrypted
4. See success message

### 📤 Export Passwords
1. **Click sidebar "Export"** button
2. Downloads `vault-export.json`
3. **Keep safe!** Contains encrypted passwords
4. Use for backup or migration

---

## 🔐 Security Features

### Master Password
- **Never stored** on device or server
- Only hashed for verification
- Required every session to decrypt vault
- Minimum 8 characters recommended

### Encryption
- **AES-256-GCM**: Industry-standard encryption
- **PBKDF2**: 100,000+ iterations for key derivation
- **Local only**: Data never leaves your device
- **Zero-knowledge**: We can't access your passwords

### Password Strength
Real-time indicator shows:
- **Length** (8+ characters recommended)
- **Character variety** (uppercase, lowercase, numbers, symbols)
- **Entropy** (statistical strength)
- **Suggestions** for improvement

---

## 🎨 UI Tour

### Header
- **Logo + Title**: App name (VaultMaster)
- **Search bar**: Find passwords quickly
- **"New" button**: Create new entry
- **Settings**: Access preferences (coming soon)
- **Lock icon**: Sign out / Lock vault

### Sidebar (Left)
- **Categories**: Filter by type (Login, Email, Banking, etc.)
- **Entry counts**: Numbers beside each category
- **Tools section**:
  - 🎲 Generator (password generator)
  - 📤 Export (backup vault)
  - 📥 Import (restore vault)
  - 🔒 Lock Vault (sign out)

### Main Content (Center)
- **Statistics cards**: Total entries, favorites, last modified
- **Password grid**: All entries displayed as cards
- **Empty state**: Helpful message when no entries
- **Entry cards**: Click to expand and view details

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between fields |
| `Enter` | Submit form / Confirm |
| `Escape` | Close modal / Cancel |
| `Ctrl+K` or `Cmd+K` | Focus search (when implemented) |

---

## 🐛 Troubleshooting

### Port 5173 Already in Use
**Error:** `EADDRINUSE: address already in use :::5173`

**Solution:**
```bash
npm run dev -- --port 3000
# Opens at http://localhost:3000
```

### Dependencies Won't Install
**Error:** `npm ERR! code ERESOLVE`

**Solution:**
```bash
npm install --legacy-peer-deps --force
```

### Build Fails
**Error:** Various build errors

**Solution:**
```bash
rm -rf node_modules package-lock.json dist
npm install --legacy-peer-deps
npm run build
```

### "Cannot find module" Error
**Error:** Module import fails

**Solution:**
```bash
npm run type-check
# Shows TypeScript errors to fix
```

### Vault Won't Unlock
**Problem:** Wrong master password entered

**Solution:**
- Password is case-sensitive
- Check for extra spaces
- No "reset password" - password is irretrievable
- Create new vault if forgotten

### Entries Won't Display
**Problem:** Grid shows empty

**Solution:**
1. Check if correct category selected in sidebar
2. Try searching for entry
3. Refresh page (data persists in browser)
4. Check browser DevTools console for errors

---

## 📚 Next Steps

### After Setup
1. ✅ Create 2-3 test entries
2. ✅ Test search functionality
3. ✅ Test export/import
4. ✅ Explore password generator
5. ✅ Check different categories

### For Development
1. Read `README.md` (full documentation)
2. Review `PROJECT_SUMMARY.md` (technical overview)
3. Check `IMPROVEMENTS.md` (vs SecureVault)
4. Explore source code in `src/` folder
5. Run tests: `npm test` (when configured)

### For Customization
1. Edit colors: `src/tailwind.config.ts`
2. Add categories: `src/types/vault.ts`
3. Modify encryption: `src/crypto/index.ts`
4. Extend features: Add to `src/stores/vaultStore.ts`

---

## 📱 Browser Support

**Tested on:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Requirements:**
- ES2020 support
- Web Crypto API support
- LocalStorage support

---

## 🚀 Deployment

### Quick Deploy (Vercel)
```bash
npm install -g vercel
vercel
# Follow prompts to deploy
```

### Deploy to Netlify
```bash
npm run build
# Drop dist/ folder to Netlify
```

### Traditional Hosting
```bash
npm run build
# Upload dist/ folder to web server
```

---

## 💬 Getting Help

### Documentation
- **README.md** - Full feature documentation
- **PROJECT_SUMMARY.md** - Technical architecture
- **IMPROVEMENTS.md** - Comparison with alternatives
- **Code comments** - Inline documentation in source

### Common Questions

**Q: Is my data safe?**
A: Yes! Encrypted locally with AES-256. Never leaves your device.

**Q: Can I sync across devices?**
A: Currently local-only. Cloud sync planned for future.

**Q: Can I export my data?**
A: Yes! Click "Export" to download encrypted backup.

**Q: What if I forget my master password?**
A: Cannot be recovered. Create new vault if forgotten.

**Q: Can you see my passwords?**
A: No! Zero-knowledge architecture. We can't access anything.

**Q: Is this production-ready?**
A: Yes! Built with security best practices and modern tech.

---

## 🎉 You're Ready!

You now have a secure, modern password manager running locally.

**Key points:**
- ✅ Master password protects everything
- ✅ Data stays on your device
- ✅ Passwords encrypted with AES-256
- ✅ Easy to export/backup
- ✅ Professional UI and UX

**Start managing passwords securely now!** 🔐

---

**VaultMaster v1.0.0** | Made with ❤️ for security