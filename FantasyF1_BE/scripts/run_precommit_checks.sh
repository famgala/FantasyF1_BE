#!/bin/bash

# ============================================
# Fast Pre-commit Check Script for Linux/Mac/WSL
# Runs fast but thorough checks locally (target: <30 seconds)
# Ensures high likelihood of CI passing
# ============================================

set -e
cd "$(dirname "$0")/.."
SCRIPT_DIR=$(pwd)

echo "============================================"
echo "Fast Pre-commit Checks (Backend)"
echo "Working directory: $SCRIPT_DIR"
echo "============================================"

EXIT_CODE=0

# 1. Black formatter (auto-fix then check)
echo ""
echo "[1/3] Running Black formatter (will auto-fix formatting)..."
if black app/ tests/ --line-length=100 > /dev/null 2>&1; then
    # Re-check to ensure all files are properly formatted
    if black --check app/ tests/ --line-length=100 > /dev/null 2>&1; then
        echo "  ✅ Black formatting passed (files normalized)"
    else
        echo "  ❌ Black formatting failed after auto-fix"
        EXIT_CODE=1
    fi
else
    echo "  ❌ Black formatting failed"
    EXIT_CODE=1
fi

# 2. Ruff linter (FAST)
echo ""
echo "[2/3] Running Ruff linter..."
if ruff check app/ tests/ > /dev/null 2>&1; then
    echo "  ✅ Ruff check passed"
else
    echo "  ❌ Ruff check failed - run 'ruff check app/ tests/ --fix' to fix"
    EXIT_CODE=1
fi

# 3. mypy type checker (FAST)
echo ""
echo "[3/3] Running mypy type checker..."
if mypy app/ > /dev/null 2>&1; then
    echo "  ✅ mypy check passed"
else
    echo "  ❌ mypy check failed - run 'mypy app/' to see issues"
    EXIT_CODE=1
fi

# Final summary
echo ""
echo "============================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All pre-commit checks passed!"
    echo "  Time: ~10-15 seconds"
    echo "  Static analysis only (no tests)"
    echo "  Ready to commit. CI will run full tests."
else
    echo "❌ Some checks failed."
    echo "  Please fix the issues above before committing."
fi
echo "============================================"
echo ""
echo "For full validation with tests, run: ./scripts/run_ci_checks.sh"
echo "============================================"

exit $EXIT_CODE