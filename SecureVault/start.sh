#!/bin/bash

# ============================================
# SecureVault - Start Both Servers
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

clear

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║     🔐 SecureVault Password Manager      ║"
echo "║     Starting All Services...             ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Store PIDs for cleanup
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function
cleanup() {
    echo ""
    echo -e "\n${YELLOW}Shutting down SecureVault...${NC}"
    
    if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null
        wait $BACKEND_PID 2>/dev/null
        echo -e "  ${GREEN}✓${NC} Backend stopped"
    fi
    
    if [ -n "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null
        wait $FRONTEND_PID 2>/dev/null
        echo -e "  ${GREEN}✓${NC} Frontend stopped"
    fi

    # Kill any remaining processes on our ports
    lsof -Pi :3001 -sTCP:LISTEN -t 2>/dev/null | xargs kill 2>/dev/null
    lsof -Pi :5173 -sTCP:LISTEN -t 2>/dev/null | xargs kill 2>/dev/null
    
    echo -e "\n${GREEN}SecureVault stopped. Goodbye! 👋${NC}\n"
    exit 0
}

# Trap Ctrl+C and other signals
trap cleanup SIGINT SIGTERM EXIT

# ============================================
# Kill existing processes on our ports
# ============================================
echo -e "${CYAN}Checking for existing processes...${NC}"

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "  ${YELLOW}→${NC} Killing process on port 3001..."
    kill $(lsof -Pi :3001 -sTCP:LISTEN -t) 2>/dev/null
    sleep 1
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "  ${YELLOW}→${NC} Killing process on port 5173..."
    kill $(lsof -Pi :5173 -sTCP:LISTEN -t) 2>/dev/null
    sleep 1
fi

# ============================================
# Check dependencies
# ============================================
echo -e "\n${CYAN}Checking dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "  ${YELLOW}→${NC} Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "  ${YELLOW}→${NC} Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check backend .env
if [ ! -f "backend/.env" ]; then
    echo -e "  ${YELLOW}→${NC} Creating backend .env..."
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
DB_PATH=./securevault.db
LOG_LEVEL=info
EOF
fi

# Check frontend .env
if [ ! -f "frontend/.env" ]; then
    echo -e "  ${YELLOW}→${NC} Creating frontend .env..."
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=SecureVault
VITE_APP_VERSION=1.0.0
EOF
fi

echo -e "  ${GREEN}✓${NC} Dependencies ready"

# ============================================
# Create log directory
# ============================================
mkdir -p backend/logs

# ============================================
# Start Backend
# ============================================
echo -e "\n${CYAN}Starting Backend Server...${NC}"

cd "$SCRIPT_DIR/backend"
mkdir -p logs cache/icons

node src/app.js > logs/stdout.log 2> logs/stderr.log &
BACKEND_PID=$!

echo -e "  ${BLUE}→${NC} Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo -ne "  ${BLUE}→${NC} Waiting for backend"
for i in {1..15}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo ""
        echo -e "  ${GREEN}✓${NC} Backend running on ${BOLD}http://localhost:3001${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Check if backend actually started
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo ""
    echo -e "  ${RED}✗ Backend failed to start${NC}"
    echo -e "  ${YELLOW}Check logs: cat backend/logs/stderr.log${NC}"
    
    # Show error log
    if [ -f "logs/stderr.log" ]; then
        echo -e "\n${RED}Error Log:${NC}"
        tail -20 logs/stderr.log
    fi
    
    cleanup
    exit 1
fi

cd "$SCRIPT_DIR"

# ============================================
# Start Frontend
# ============================================
echo -e "\n${CYAN}Starting Frontend Server...${NC}"

cd "$SCRIPT_DIR/frontend"

npx vite --host > /dev/null 2>&1 &
FRONTEND_PID=$!

echo -e "  ${BLUE}→${NC} Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
echo -ne "  ${BLUE}→${NC} Waiting for frontend"
for i in {1..15}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo ""
        echo -e "  ${GREEN}✓${NC} Frontend running on ${BOLD}http://localhost:5173${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo ""
    echo -e "  ${YELLOW}⚠${NC} Frontend may still be starting..."
fi

cd "$SCRIPT_DIR"

# ============================================
# Display Status
# ============================================
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║     🔐 SecureVault is Running! 🚀       ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  Frontend:  http://localhost:5173         ║"
echo "║  Backend:   http://localhost:3001         ║"
echo "║  Health:    http://localhost:3001/health   ║"
echo "║                                          ║"
echo "║  Backend PID:  $BACKEND_PID                       ║"
echo "║  Frontend PID: $FRONTEND_PID                       ║"
echo "║                                          ║"
echo "║  Press Ctrl+C to stop all servers        ║"
echo "║                                          ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# Keep Running & Monitor
# ============================================
while true; do
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "\n${RED}⚠ Backend process died! Restarting...${NC}"
        cd "$SCRIPT_DIR/backend"
        node src/app.js >> logs/stdout.log 2>> logs/stderr.log &
        BACKEND_PID=$!
        echo -e "${GREEN}✓ Backend restarted (PID: $BACKEND_PID)${NC}"
        cd "$SCRIPT_DIR"
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "\n${RED}⚠ Frontend process died! Restarting...${NC}"
        cd "$SCRIPT_DIR/frontend"
        npx vite --host > /dev/null 2>&1 &
        FRONTEND_PID=$!
        echo -e "${GREEN}✓ Frontend restarted (PID: $FRONTEND_PID)${NC}"
        cd "$SCRIPT_DIR"
    fi
    
    sleep 5
done

