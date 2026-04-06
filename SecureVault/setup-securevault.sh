#!/bin/bash
# save as: setup-securevault.sh

cd ~/Ctrl-build-projects/SecureVault

echo "🔐 Setting up SecureVault..."

# Backend
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "To run the application:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
