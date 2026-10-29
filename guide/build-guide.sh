#!/bin/bash
# Builds "guide/CSV to Numbers - Guide.pdf" from guide/guide.html using headless Google Chrome.
set -e
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome is needed to build the PDF" >&2; exit 1; }

"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PWD/CSV to Numbers - Guide.pdf" "file://$PWD/guide.html" 2>/dev/null
echo "Built guide/CSV to Numbers - Guide.pdf"
