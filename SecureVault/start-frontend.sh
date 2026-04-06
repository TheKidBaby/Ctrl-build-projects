#!/bin/bash

# ============================================
# SecureVault - Start Frontend Server
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║    🎨 SecureVault - Frontend Server      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Dependencies not installed. Running npm install...${NC}"
    npm install
fi

# Check if .env exists, create default if not
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env not found, creating default...${NC}"
    cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=SecureVault
VITE_APP_VERSION=1.0.0
EOF
fi

# Check if port 5173 is already in use
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 5173 is already in use${NC}"
    read -p "Kill existing process? (y/n): " KILL_EXISTING
    if [ "$KILL_EXISTING" = "y" ]; then
        kill $(lsof -Pi :5173 -sTCP:LISTEN -t) 2>/dev/null
        sleep 1
        echo -e "${GREEN}✓ Previous process killed${NC}"
    else
        echo -e "${RED}✗ Cannot start. Port 5173 in use${NC}"
        exit 1
    fi
fi

echo -e "${CYAN}Starting frontend dev server...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start Vite dev server
npx vite --host

