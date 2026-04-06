# Getting Started with VaultMaster

Welcome! This guide will help you get VaultMaster running on your computer in just a few minutes.

## ⚡ Quick Setup (5 minutes)

If you already have Node.js installed, here are the 3 commands you need:

```bash
git clone https://github.com/YOUR-USERNAME/VaultMaster.git
cd VaultMaster
npm install --legacy-peer-deps && npm run dev
```

Then open: **http://localhost:5173**

---

## 📋 Step-by-Step Setup

### Step 1: Check Prerequisites

Before starting, make sure you have these installed:

#### Node.js & npm
Check if you have Node.js installed:
```bash
node --version
npm --version
```

**Expected output:**
- Node.js: `v18.0.0` or higher
- npm: `9.0.0` or higher

**If you don't have it:**
- Download from: https://nodejs.org/
- Choose the **LTS (Long Term Support)** version
- Install and follow the wizard
- Restart your terminal/command prompt

#### Git (Optional, for cloning)
```bash
git --version
```

If not installed, download from: https://git-scm.com/

---

### Step 2: Clone the Repository

Choose one method:

#### Method A: Using Git (Recommended)
```bash
git clone https://github.com/YOUR-USERNAME/VaultMaster.git
cd VaultMaster
```

#### Method B: Download ZIP
1. Go to the GitHub repository
2. Click **Code** → **Download ZIP**
3. Extract the ZIP file
4. Open terminal/command prompt in the extracted folder

#### Method C: GitHub Desktop
1. Open https://desktop.github.com/
2. Click **Clone a repository**
3. Paste: `YOUR-USERNAME/VaultMaster`
4. Click **Clone**

---

### Step 3: Install Dependencies

```bash
npm install --legacy-peer-deps
```

**What does this command do?**
- Downloads all required packages (React, TypeScript, Tailwind, etc.)
- `--legacy-peer-deps` tells npm to ignore some version conflicts (this is normal and safe)
- Takes 2-5 minutes depending on your internet speed

**You should see:**
```
added 500 packages in 2m15s
```

---

### Step 4: Start the Development Server

```bash
npm run dev
```

**You should see:**
```
VITE v5.0.8 ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

The browser should open automatically. If not, manually visit: **http://localhost:5173**

---

### Step 5: First Time Setup

When you first open VaultMaster:

1. **Create a Master Password**
   - Choose something strong (8+ characters)
   - Mix of uppercase, lowercase, numbers, symbols
   - **This is important:** If you forget it, you can't recover your vault

2. **Confirm Password**
   - Type it again to verify

3. **Welcome to Your Vault!**
   - You're now authenticated and encrypted
   - Your vault is ready to use

4. **Add Your First Entry**
   - Click **"New Entry"** button
   - Fill in details (title, username, password)
   - Click **"Create Entry"**

---

## 🛠️ Available Commands

### Development
```bash
npm run dev        # Start development server with hot-reload
```

### Production
```bash
npm run build      # Create production build
npm run preview    # Preview the production build locally
```

### Quality Checks
```bash
npm run type-check # Check for TypeScript errors
npm run lint       # Check code quality with ESLint
npm run test       # Run unit tests
npm run test:ui    # Run tests with visual UI
```

---

## 🐛 Troubleshooting

### "Command not found: npm"
**Problem:** npm is not installed or not in your PATH

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart your terminal/command prompt
3. Verify: `npm --version`

---

### "Port 5173 already in use"
**Problem:** Another app is using port 5173

**Solution 1: Use a different port**
```bash
npm run dev -- --port 3000
```
Then visit: http://localhost:3000

**Solution 2: Kill the process using port 5173**

**On Windows:**
```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**On Mac/Linux:**
```bash
lsof -i :5173
kill -9 <PID>
```

---

### "npm ERR! code ERESOLVE"
**Problem:** Dependency conflicts

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

### "Module not found" or TypeScript errors
**Problem:** Dependencies not fully installed

**Solution:**
```bash
npm install --legacy-peer-deps
npm run type-check
```

---

### "Blank page" or app won't load
**Problem:** Cache or build issue

**Solution:**
```bash
# Clear browser cache
# Option 1: Hard refresh in browser (Ctrl+Shift+R or Cmd+Shift+R)

# Option 2: Clear build cache
rm -rf dist .vite
npm run dev
```

---

### "I forgot my master password"
**Problem:** Your vault is encrypted, can't be recovered

**Solution:**
- Unfortunately, there's no recovery mechanism (this is by design for security)
- You can export your vault as a backup before forgetting
- Create a new vault with a new master password

---

## 📂 Project Structure

```
VaultMaster/
├── src/                    # Source code
│   ├── components/        # React components
│   ├── layouts/           # Page layouts
│   ├── stores/            # Zustand state management
│   ├── utils/             # Utility functions
│   ├── crypto/            # Encryption utilities
│   ├── types/             # TypeScript definitions
│   ├── App.tsx            # Root component
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── dist/                  # Production build (created by npm run build)
├── package.json           # Project dependencies
├── vite.config.ts         # Build configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── README.md              # Project documentation
```

---

## 📱 Browser Compatibility

VaultMaster works on:
- ✅ Chrome/Chromium (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Edge (v90+)

Recommended: Latest version of your preferred browser

---

## 🔐 Data Storage

Your passwords are stored in:
- **Location:** Browser's localStorage
- **Encryption:** AES-256-GCM (local)
- **Where:** Only on your device, never sent to servers
- **Access:** Browser Developer Tools → Application → Local Storage

---

## 💡 Tips & Tricks

### Generate Strong Passwords
1. Click "New Entry"
2. Click **"Generate"** button next to password field
3. It creates a random, strong password

### Search Your Vault
1. Use the search bar at the top
2. Search by title, username, URL, or tags
3. Real-time filtering

### Organize with Categories
1. Entries automatically sorted by category
2. Click category in sidebar to filter
3. 8 built-in categories (Login, Email, Banking, etc.)

### Export Your Vault
1. Click menu or settings (when available)
2. Choose **Export**
3. Get a JSON backup file
4. Keep it safe!

### Import Backup
1. Click menu or settings
2. Choose **Import**
3. Select your backup JSON file
4. Entries restored to vault

---

## 🚀 Deployment

To share VaultMaster online, you can deploy the production build to:

### Free Options:
- **Vercel:** https://vercel.com/ (recommended for Vite)
- **Netlify:** https://netlify.com/
- **GitHub Pages:** https://pages.github.com/

### Quick Vercel Deploy:
```bash
npm run build
# Install Vercel CLI
npm i -g vercel
# Deploy
vercel
```

---

## 📚 Learn More

- **TypeScript:** https://www.typescriptlang.org/
- **React:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Zustand:** https://zustand-demo.vercel.app/
- **Vite:** https://vitejs.dev/

---

## ❓ Still Having Issues?

1. **Check the README.md** for more information
2. **Check FEATURES_COMPLIANCE.md** to understand what VaultMaster can do
3. **Look at the code** - it's well-commented
4. **Open an issue on GitHub** with:
   - What you tried to do
   - What error you got
   - Your Node.js and npm versions
   - Your operating system

---

## 🎉 You're All Set!

You should now have VaultMaster running. Here's what to try next:

1. ✅ Create a master password
2. ✅ Add a test password entry
3. ✅ Search for it
4. ✅ Copy the password
5. ✅ Try the password generator
6. ✅ Export your vault as backup
7. ✅ Explore the categories and tags

**Enjoy your secure password manager!** 🔐

---

**Questions?** Check the README.md or open an issue on GitHub.

**Version:** 1.0.0  
**Last Updated:** 2024