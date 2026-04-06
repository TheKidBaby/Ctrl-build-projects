#!/bin/bash

# ============================================
# SecureVault - Complete Setup Script
# Run this ONCE when setting up for first time
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

clear

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║       🔐 SecureVault Setup Script        ║"
echo "║     Enterprise Password Manager          ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ============================================
# Check Prerequisites
# ============================================
echo -e "\n${CYAN}━━━ Checking Prerequisites ━━━${NC}\n"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ${GREEN}✓${NC} Node.js installed: ${BOLD}$NODE_VERSION${NC}"
else
    echo -e "  ${RED}✗ Node.js not found${NC}"
    echo -e "  ${YELLOW}Install with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "  ${GREEN}✓${NC} npm installed: ${BOLD}$NPM_VERSION${NC}"
else
    echo -e "  ${RED}✗ npm not found${NC}"
    exit 1
fi

# Check Node version >= 18
NODE_MAJOR=$(node --version | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "  ${RED}✗ Node.js version must be 18 or higher (found: $NODE_VERSION)${NC}"
    exit 1
fi

echo -e "  ${GREEN}✓${NC} All prerequisites met"

# ============================================
# Setup Backend
# ============================================
echo -e "\n${CYAN}━━━ Setting Up Backend ━━━${NC}\n"

if [ ! -d "backend" ]; then
    echo -e "  ${RED}✗ Backend directory not found${NC}"
    exit 1
fi

cd backend

# Create directories
echo -e "  ${BLUE}→${NC} Creating directories..."
mkdir -p logs
mkdir -p cache/icons

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "  ${BLUE}→${NC} Creating .env file..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    
    cat > .env << ENVEOF
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

DB_PATH=./securevault.db

LOG_LEVEL=info
ENVEOF

    echo -e "  ${GREEN}✓${NC} .env created with secure JWT secret"
else
    echo -e "  ${YELLOW}→${NC} .env already exists, skipping"
fi

# Install dependencies
echo -e "  ${BLUE}→${NC} Installing backend dependencies..."
npm install 2>&1 | tail -1

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "  ${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

# Verify critical files exist
MISSING_FILES=()
[ ! -f "src/app.js" ] && MISSING_FILES+=("src/app.js")
[ ! -f "src/config/database.js" ] && MISSING_FILES+=("src/config/database.js")
[ ! -f "src/routes/auth.js" ] && MISSING_FILES+=("src/routes/auth.js")
[ ! -f "src/routes/passwords.js" ] && MISSING_FILES+=("src/routes/passwords.js")
[ ! -f "src/routes/breach.js" ] && MISSING_FILES+=("src/routes/breach.js")
[ ! -f "src/routes/vault.js" ] && MISSING_FILES+=("src/routes/vault.js")
[ ! -f "src/routes/icons.js" ] && MISSING_FILES+=("src/routes/icons.js")
[ ! -f "src/routes/sync.js" ] && MISSING_FILES+=("src/routes/sync.js")
[ ! -f "src/middleware/auth.js" ] && MISSING_FILES+=("src/middleware/auth.js")
[ ! -f "src/middleware/errorHandler.js" ] && MISSING_FILES+=("src/middleware/errorHandler.js")
[ ! -f "src/middleware/logger.js" ] && MISSING_FILES+=("src/middleware/logger.js")
[ ! -f "src/models/User.js" ] && MISSING_FILES+=("src/models/User.js")
[ ! -f "src/models/Password.js" ] && MISSING_FILES+=("src/models/Password.js")
[ ! -f "src/models/Category.js" ] && MISSING_FILES+=("src/models/Category.js")
[ ! -f "src/crypto/secureRandom.js" ] && MISSING_FILES+=("src/crypto/secureRandom.js")
[ ! -f "src/crypto/argon2.js" ] && MISSING_FILES+=("src/crypto/argon2.js")
[ ! -f "src/services/breachDetection.js" ] && MISSING_FILES+=("src/services/breachDetection.js")

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "  ${RED}✗ Missing files:${NC}"
    for f in "${MISSING_FILES[@]}"; do
        echo -e "    ${RED}• $f${NC}"
    done
    echo -e "  ${YELLOW}Please create these files before running${NC}"
else
    echo -e "  ${GREEN}✓${NC} All backend files verified"
fi

# Test backend starts (quick check)
echo -e "  ${BLUE}→${NC} Testing backend..."
timeout 5 node src/app.js &>/dev/null &
BACKEND_PID=$!
sleep 3

if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Backend starts successfully"
    kill $BACKEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
else
    echo -e "  ${YELLOW}⚠${NC} Backend test failed (may need missing files)"
fi

# Clean up test database
rm -f securevault.db 2>/dev/null

cd "$SCRIPT_DIR"

# ============================================
# Setup Frontend
# ============================================
echo -e "\n${CYAN}━━━ Setting Up Frontend ━━━${NC}\n"

if [ ! -d "frontend" ]; then
    echo -e "  ${RED}✗ Frontend directory not found${NC}"
    exit 1
fi

cd frontend

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "  ${BLUE}→${NC} Creating .env file..."
    cat > .env << ENVEOF
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=SecureVault
VITE_APP_VERSION=1.0.0
ENVEOF
    echo -e "  ${GREEN}✓${NC} .env created"
else
    echo -e "  ${YELLOW}→${NC} .env already exists, skipping"
fi

# Install dependencies
echo -e "  ${BLUE}→${NC} Installing frontend dependencies..."
npm install 2>&1 | tail -1

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "  ${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi

# Verify critical files exist
MISSING_FILES=()
[ ! -f "src/App.jsx" ] && MISSING_FILES+=("src/App.jsx")
[ ! -f "src/main.jsx" ] && MISSING_FILES+=("src/main.jsx")
[ ! -f "src/index.css" ] && MISSING_FILES+=("src/index.css")
[ ! -f "src/crypto/vault.js" ] && MISSING_FILES+=("src/crypto/vault.js")
[ ! -f "src/services/api.js" ] && MISSING_FILES+=("src/services/api.js")
[ ! -f "src/stores/vaultStore.js" ] && MISSING_FILES+=("src/stores/vaultStore.js")
[ ! -f "src/pages/Login.jsx" ] && MISSING_FILES+=("src/pages/Login.jsx")
[ ! -f "src/pages/Register.jsx" ] && MISSING_FILES+=("src/pages/Register.jsx")
[ ! -f "src/pages/Dashboard.jsx" ] && MISSING_FILES+=("src/pages/Dashboard.jsx")
[ ! -f "tailwind.config.js" ] && MISSING_FILES+=("tailwind.config.js")
[ ! -f "postcss.config.js" ] && MISSING_FILES+=("postcss.config.js")
[ ! -f "vite.config.js" ] && MISSING_FILES+=("vite.config.js")

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "  ${RED}✗ Missing files:${NC}"
    for f in "${MISSING_FILES[@]}"; do
        echo -e "    ${RED}• $f${NC}"
    done
else
    echo -e "  ${GREEN}✓${NC} All frontend files verified"
fi

cd "$SCRIPT_DIR"

# ============================================
# Summary
# ============================================
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║        ✅ Setup Complete!                ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "  ${BOLD}Next Steps:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Start backend:   ${BOLD}./start-backend.sh${NC}"
echo -e "  ${CYAN}2.${NC} Start frontend:  ${BOLD}./start-frontend.sh${NC}"
echo -e "  ${CYAN}3.${NC} Start both:      ${BOLD}./start.sh${NC}"
echo ""
echo -e "  ${CYAN}URLs:${NC}"
echo -e "    Frontend:  ${BOLD}http://localhost:5173${NC}"
echo -e "    Backend:   ${BOLD}http://localhost:3001${NC}"
echo -e "    Health:    ${BOLD}http://localhost:3001/health${NC}"
echo ""
