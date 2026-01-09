#!/bin/bash

# ============================================
# Run All CI Checks Locally
# This script runs all the same tests that GitHub Actions will run
# ============================================

set -e

echo "============================================"
echo "Running CI Checks Locally"
echo "============================================"

EXIT_CODE=0

# 1. Black formatter check
echo ""
echo "[1/4] Running Black formatter check..."
if black --check app/ tests/; then
    echo "✅ Black check passed"
else
    echo "❌ Black check failed"
    EXIT_CODE=1
fi

# 2. Ruff linter
echo ""
echo "[2/4] Running Ruff linter..."
if ruff check app/ tests/; then
    echo "✅ Ruff check passed"
else
    echo "❌ Ruff check failed"
    EXIT_CODE=1
fi

# 3. mypy type checker
echo ""
echo "[3/4] Running mypy type checker..."
if mypy app/; then
    echo "✅ mypy check passed"
else
    echo "❌ mypy check failed"
    EXIT_CODE=1
fi

# 4. pytest with coverage
echo ""
echo "[4/4] Running pytest with coverage..."
if pytest tests/ --cov=app --cov-report=html; then
    echo "✅ pytest passed"
else
    echo "❌ pytest failed"
    EXIT_CODE=1
fi

# Final summary
echo ""
echo "============================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All CI checks passed!"
    echo "You're ready to push your changes."
else
    echo "❌ Some CI checks failed."
    echo "Please fix the issues above before pushing."
fi
echo "============================================"

exit $EXIT_CODE