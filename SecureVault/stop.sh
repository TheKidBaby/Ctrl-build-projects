
#!/bin/bash

# ============================================
# SecureVault - Stop All Services
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping SecureVault services...${NC}"

# Kill processes on port 3001 (backend)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    kill $(lsof -Pi :3001 -sTCP:LISTEN -t) 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Backend stopped (port 3001)"
else
    echo -e "  ${YELLOW}→${NC} Backend was not running"
fi

# Kill processes on port 5173 (frontend)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    kill $(lsof -Pi :5173 -sTCP:LISTEN -t) 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Frontend stopped (port 5173)"
else
    echo -e "  ${YELLOW}→${NC} Frontend was not running"
fi

# Kill any node processes related to SecureVault
pkill -f "node src/app.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo -e "\n${GREEN}All SecureVault services stopped ✓${NC}"

