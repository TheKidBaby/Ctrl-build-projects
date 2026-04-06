# VaultMaster - Modern Encrypted Password Manager

A sophisticated, feature-rich password manager built with React, TypeScript, and Tailwind CSS. VaultMaster provides end-to-end encryption, intuitive UI, and comprehensive security features for managing your digital identity.

## 🔐 Features

### Core Security
- **End-to-End Encryption** - All passwords encrypted locally using AES-256
- **Master Password Protection** - Single master password secures entire vault
- **Zero-Knowledge Architecture** - Your data never leaves your device
- **Secure Password Generation** - Built-in generator with customizable options
- **Password Strength Analyzer** - Real-time strength evaluation with suggestions

### User Experience
- **Intuitive Dashboard** - Clean, modern interface for managing passwords
- **Smart Search & Filter** - Full-text search across all entries
- **Category Organization** - Pre-defined categories (login, banking, email, etc.)
- **Favorites System** - Quick access to frequently used passwords
- **Dark & Light Themes** - Comfortable viewing in any environment
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### Advanced Features
- **Import/Export** - Backup and restore vault data securely
- **Password Audit** - Identify weak or reused passwords
- **Breach Checking** - Check if passwords appear in known breaches
- **Auto-fill Detection** - Browser integration ready (future feature)
- **Audit Logs** - Track all vault access and modifications
- **Custom Fields** - Add custom information to entries

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or yarn

### Installation & Running

**Step 1: Clone the repository**
```bash
git clone https://github.com/YOUR-USERNAME/VaultMaster.git
cd VaultMaster
```

**Step 2: Install dependencies**
```bash
npm install --legacy-peer-deps
```

**Step 3: Start development server**
```bash
npm run dev
```

✅ App opens automatically at `http://localhost:5173`

**That's it!** You can now:
- Create a master password
- Add password entries
- Search and organize your vault
- Export/import backups

### Production Build
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Other Useful Commands
```bash
npm run type-check    # Check TypeScript errors
npm run lint          # Check code quality
npm run test          # Run tests
npm run test:ui       # Run tests with UI
```

### Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 3000
```

**Dependencies not installing?**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Issues running? Check:**
- Node.js version: `node --version` (should be 18+)
- npm version: `npm --version`
- Clear browser cache or use incognito mode

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── VaultGrid.tsx   # Password entries grid
│   ├── EntryModal.tsx  # Create/edit form
│   └── ...
├── layouts/            # Page layouts
│   ├── AuthLayout.tsx  # Login/setup screen
│   └── DashboardLayout.tsx  # Main dashboard
├── stores/             # Zustand state management
│   └── vaultStore.ts   # Global vault store
├── types/              # TypeScript definitions
│   └── vault.ts        # Domain types
├── utils/              # Utility functions
│   ├── passwordStrength.ts
│   ├── storage.ts
│   └── index.ts
├── crypto/             # Encryption utilities
├── hooks/              # Custom React hooks
├── App.tsx             # Root component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Build & Development
- **Vite** - Fast build tool
- **PostCSS** - CSS processing
- **Autoprefixer** - Browser compatibility

### Quality & Testing
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking
- **Vitest** - Unit testing (optional)

## 🔑 Security Features

### Encryption
- **AES-256-GCM** - Authenticated encryption
- **PBKDF2** - Key derivation (100k+ iterations)
- **Random IVs** - Each entry has unique initialization vector
- **Salt Hashing** - Additional randomization

### Best Practices
- **No cloud storage** - Data stored locally only
- **Master password never stored** - Only hashed version kept
- **Secure random generation** - Uses cryptographic randomness
- **Auto-lock on inactivity** - Configurable timeout
- **Secure memory clearing** - Sensitive data removed after use

## 📝 Usage Guide

### Creating Your First Entry

1. Click **"New"** button in header
2. Fill in entry details:
   - **Title** - Name of the account (e.g., "Gmail Account")
   - **Category** - Choose from predefined categories
   - **Username/Email** - Your login username
   - **Password** - Use generator or paste existing
   - **Website URL** - Link to the service
   - **Notes** - Additional information
   - **Tags** - Comma-separated labels for organization

3. Click **"Create Entry"** to save

### Searching & Filtering

- Use the **search bar** for full-text search
- Click **categories** in sidebar to filter by type
- Click **star icon** to view only favorites

### Managing Entries

- **Copy Password** - One-click copy to clipboard
- **Edit** - Modify existing entry details
- **Delete** - Permanently remove entry (confirmation required)
- **Favorite** - Star icon for quick access

### Backup & Recovery

- **Export** - Download encrypted backup (JSON format)
- **Import** - Restore from previous backup
- Always keep backups in secure location

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.ts` to customize color palette:
```typescript
primary: { /* Blue palette */ },
secondary: { /* Purple accents */ },
danger: { /* Red for deletions */ },
success: { /* Green for confirmations */ },
warning: { /* Yellow for alerts */ },
```

### Settings
Future settings panel will include:
- Lock timeout duration
- Master password requirements
- Theme preference
- Biometric authentication
- Auto-fill options

## 🧪 Testing

Run type checking:
```bash
npm run type-check
```

Run linting:
```bash
npm run lint
```

Run tests:
```bash
npm test
npm run test:ui  # With UI
```

## 📦 Build Output

Production build creates optimized, single-file distribution:
- Minified JavaScript and CSS
- Lazy-loaded chunks for faster initial load
- Source maps excluded for security
- Gzip compression enabled

Build size: ~80KB gzipped

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
npm run type-check
```

### Build fails
```bash
# Clear cache and rebuild
rm -rf dist .vite
npm run build
```

### Port 5173 in use
Vite will automatically use next available port. Or specify custom port:
```bash
npm run dev -- --port 3000
```

## 🔄 Development Workflow

### Creating New Components

1. Add component file in `src/components/`
2. Define TypeScript interfaces
3. Use Tailwind CSS classes
4. Import and export from `src/components/index.ts`
5. Use in layouts or other components

### Adding New Pages

1. Create layout file in `src/layouts/`
2. Add route logic in `App.tsx`
3. Import components as needed
4. Test routing with `useVaultStore` integration

### State Management

All state managed through Zustand store:
```typescript
import { useVaultStore } from '@stores/vaultStore'

function MyComponent() {
  const { entries, addEntry } = useVaultStore()
  // Use state and actions
}
```

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Core password management
- ✅ Local encryption
- ✅ Import/export
- ✅ Search & filtering
- ✅ Category organization

### Phase 2 (Planned)
- [ ] Password strength analysis
- [ ] Breach detection
- [ ] Browser extension
- [ ] Biometric unlock
- [ ] Two-factor authentication support

### Phase 3 (Future)
- [ ] Cloud sync with E2E encryption
- [ ] Team/family sharing
- [ ] Autofill in web forms
- [ ] Mobile app
- [ ] Password history & recovery

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Write descriptive component names
- Document complex logic
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## ⚠️ Security Disclaimer

While VaultMaster implements industry-standard encryption and security practices, no system is 100% secure. Always:

- Keep your master password strong and unique
- Never share your master password
- Maintain regular backups
- Keep your browser and OS updated
- Use on trusted devices only
- Report security vulnerabilities responsibly

For security issues, email: security@vaultmaster.local (update with actual contact)

## 🙋 Support

- **Documentation** - Check project README and code comments
- **Issues** - Report bugs and request features on GitHub
- **Discussions** - Community support and questions

## 🎯 Vision

VaultMaster aims to be the most secure, user-friendly password manager available. Built with privacy-first principles and modern web technologies, it empowers users to take control of their digital security without compromising on usability.

---

**Made with ❤️ for security-conscious users**