#!/bin/bash

# ============================================
# SecureVault - Start Backend Server
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║    🔐 SecureVault - Backend Server       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Dependencies not installed. Running npm install...${NC}"
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ .env file not found. Run ./setup.sh first${NC}"
    exit 1
fi

# Check if port 3001 is already in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 3001 is already in use${NC}"
    read -p "Kill existing process? (y/n): " KILL_EXISTING
    if [ "$KILL_EXISTING" = "y" ]; then
        kill $(lsof -Pi :3001 -sTCP:LISTEN -t) 2>/dev/null
        sleep 1
        echo -e "${GREEN}✓ Previous process killed${NC}"
    else
        echo -e "${RED}✗ Cannot start. Port 3001 in use${NC}"
        exit 1
    fi
fi

# Create directories if needed
mkdir -p logs cache/icons

echo -e "${CYAN}Starting backend server...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start with nodemon for development
if command -v npx &> /dev/null && [ -f "node_modules/.bin/nodemon" ]; then
    npx nodemon src/app.js
else
    node src/app.js
fi
