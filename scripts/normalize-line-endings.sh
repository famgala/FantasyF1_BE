#!/bin/bash
# Normalize all text files to LF line endings after adding .gitattributes
# This script should be run once after adding .gitattributes to fix line ending issues

set -e

echo "Normalizing line endings for all text files..."

# This command will rewrite all files to use the line ending specified in .gitattributes
git ls-files --eol | grep 'i/crlf' | cut -f2 | while read -r file; do
    if [ -f "$file" ]; then
        echo "Normalizing: $file"
        dos2unix "$file" 2>/dev/null || iconv -f UTF-8 -t UTF-8 "$file" > "$file.tmp" && mv "$file.tmp" "$file" || true
    fi
done

echo "Line ending normalization complete!"
echo "Please review the changes and commit them."