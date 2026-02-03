#!/bin/bash

# ============================================
# Git Hooks Installation Script for Unix/Linux/Mac
# Installs git hooks from .githooks directory
# ============================================

echo "============================================"
echo "Installing Git Hooks"
echo "============================================"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Check if .githooks directory exists
GITHOOKS_DIR="$PROJECT_ROOT/.githooks"
if [ ! -d "$GITHOOKS_DIR" ]; then
    echo "[ERROR] .githooks directory not found at $GITHOOKS_DIR"
    exit 1
fi

echo "[OK] Found githooks directory at: $GITHOOKS_DIR"
echo ""

# Copy hooks to .git/hooks
echo "[INFO] Installing pre-commit hook..."
cp "$GITHOOKS_DIR/pre-commit" "$PROJECT_ROOT/.git/hooks/pre-commit"

if [ $? -eq 0 ]; then
    echo "[OK] Pre-commit hook installed successfully"
    chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"
else
    echo "[ERROR] Failed to install pre-commit hook"
    exit 1
fi

echo ""
echo "[INFO] Available hooks:"
ls -la "$GITHOOKS_DIR"

echo ""
echo "============================================"
echo "[OK] Git hooks installation complete!"
echo ""
echo "The pre-commit hook will now run automatically"
echo "before each commit to check code quality."
echo ""
echo "To skip the hook (not recommended):"
echo "  git commit --no-verify"
echo "============================================"