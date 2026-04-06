#!/bin/bash

# ============================================
# SecureVault - Production Build
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║     🔐 SecureVault - Production Build    ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# Build Frontend
# ============================================
echo -e "${CYAN}━━━ Building Frontend ━━━${NC}"

cd "$SCRIPT_DIR/frontend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "  ${BLUE}→${NC} Installing dependencies..."
    npm install
fi

# Install terser if not present
if [ ! -d "node_modules/terser" ]; then
    echo -e "  ${BLUE}→${NC} Installing terser for minification..."
    npm install -D terser
fi

echo -e "  ${BLUE}→${NC} Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    # Show build size
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo -e "  ${GREEN}✓${NC} Frontend built successfully (${BOLD}$BUILD_SIZE${NC})"
    echo ""
    echo -e "  ${BLUE}Build output:${NC}"
    ls -lh dist/assets/ | awk '{print "    " $5 " " $9}' | grep -v "^    $"
else
    echo -e "  ${RED}✗ Frontend build failed${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"

# ============================================
# Verify Backend
# ============================================
echo -e "\n${CYAN}━━━ Verifying Backend ━━━${NC}"

cd "$SCRIPT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo -e "  ${BLUE}→${NC} Installing dependencies..."
    npm install --production
fi

# Quick syntax check
node --check src/app.js 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Backend verified"
else
    echo -e "  ${RED}✗ Backend has syntax errors${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"

# ============================================
# Summary
# ============================================
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║     ✅ Production Build Complete!        ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  Frontend: frontend/dist/                ║"
echo "║  Backend:  Ready to deploy               ║"
echo "║                                          ║"
echo "║  Deploy with:                            ║"
echo "║    Backend:  node backend/src/app.js     ║"
echo "║    Frontend: Serve frontend/dist/        ║"
echo "║                                          ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"
