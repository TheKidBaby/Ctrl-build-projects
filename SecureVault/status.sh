#!/bin/bash

# ============================================
# SecureVault - Service Status
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║     🔐 SecureVault - Service Status      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check Backend
echo -e "${BOLD}Backend (port 3001):${NC}"
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -Pi :3001 -sTCP:LISTEN -t)
    echo -e "  ${GREEN}● Running${NC} (PID: $PID)"
    
    # Health check
    HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}● Health:${NC} $HEALTH"
    else
        echo -e "  ${YELLOW}● Health check failed${NC}"
    fi
else
    echo -e "  ${RED}● Stopped${NC}"
fi

echo ""

# Check Frontend
echo -e "${BOLD}Frontend (port 5173):${NC}"
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -Pi :5173 -sTCP:LISTEN -t)
    echo -e "  ${GREEN}● Running${NC} (PID: $PID)"
    echo -e "  ${BLUE}● URL:${NC} http://localhost:5173"
else
    echo -e "  ${RED}● Stopped${NC}"
fi

echo ""

# Check Database
echo -e "${BOLD}Database:${NC}"
if [ -f "backend/securevault.db" ]; then
    DB_SIZE=$(du -h backend/securevault.db | cut -f1)
    echo -e "  ${GREEN}● Exists${NC} (Size: $DB_SIZE)"
else
    echo -e "  ${YELLOW}● Not created yet${NC} (will be created on first run)"
fi

echo ""

# Check Dependencies
echo -e "${BOLD}Dependencies:${NC}"
if [ -d "backend/node_modules" ]; then
    echo -e "  ${GREEN}●${NC} Backend: Installed"
else
    echo -e "  ${RED}●${NC} Backend: Not installed"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "  ${GREEN}●${NC} Frontend: Installed"
else
    echo -e "  ${RED}●${NC} Frontend: Not installed"
fi

echo ""

# Check Environment Files
echo -e "${BOLD}Environment Files:${NC}"
if [ -f "backend/.env" ]; then
    echo -e "  ${GREEN}●${NC} Backend .env: Exists"
else
    echo -e "  ${RED}●${NC} Backend .env: Missing (run ./setup.sh)"
fi

if [ -f "frontend/.env" ]; then
    echo -e "  ${GREEN}●${NC} Frontend .env: Exists"
else
    echo -e "  ${RED}●${NC} Frontend .env: Missing (run ./setup.sh)"
fi

echo ""

# Check Logs
echo -e "${BOLD}Recent Logs:${NC}"
if [ -f "backend/logs/stderr.log" ]; then
    ERRORS=$(wc -l < backend/logs/stderr.log)
    echo -e "  ${YELLOW}●${NC} Backend errors: $ERRORS lines"
    if [ "$ERRORS" -gt 0 ]; then
        echo -e "    ${YELLOW}Last error:${NC}"
        tail -1 backend/logs/stderr.log | sed 's/^/    /'
    fi
else
    echo -e "  ${GREEN}●${NC} No error logs"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Commands:${NC}"
echo -e "  ./setup.sh          - First time setup"
echo -e "  ./start.sh          - Start both servers"
echo -e "  ./start-backend.sh  - Start backend only"
echo -e "  ./start-frontend.sh - Start frontend only"
echo -e "  ./stop.sh           - Stop all servers"
echo -e "  ./build.sh          - Build for production"
echo -e "  ./status.sh         - Show this status"

