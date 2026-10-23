#!/bin/bash
# Builds the self-contained app:  dist/CSV to Numbers.app
#   ./build-app.sh            build only
#   ./build-app.sh --install  build, then install to /Applications (or ~/Applications if not writable)
# Needs only macOS (osacompile, plutil, codesign).

set -e
cd "$(dirname "$0")"

APP_ID="com.automation.csvtonumbers"
# Version: $VERSION if set (the release workflow passes the tag), else the latest git tag, else "0.0.0".
VERSION="${VERSION:-$(git describe --tags --abbrev=0 2>/dev/null || echo 0.0.0)}"
VERSION="${VERSION#v}"
QA="quick-action/Open in Numbers (as text).workflow"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
# Build outside the source folder: iCloud-synced folders (e.g. Documents) keep adding attributes
# that make codesign fail.
APP="$TMP/CSV to Numbers.app"

rm -rf dist
mkdir -p dist
cat "CSV to Numbers.js" "App Entry.js" > "$TMP/app.js"

/usr/bin/osacompile -l JavaScript -o "$APP" "$TMP/app.js"
PLIST="$APP/Contents/Info.plist"
/usr/bin/plutil -replace CFBundleIdentifier -string "$APP_ID" "$PLIST"
/usr/bin/plutil -replace CFBundleName -string "CSV to Numbers" "$PLIST"
/usr/bin/plutil -replace CFBundleShortVersionString -string "$VERSION" "$PLIST"
/usr/bin/plutil -replace CFBundleVersion -string "$VERSION" "$PLIST"
/usr/bin/plutil -replace NSHumanReadableCopyright -string "Copyright © 2026 Danny Whitehead. MIT licence." "$PLIST"
/usr/bin/plutil -replace NSAppleEventsUsageDescription -string "CSV to Numbers needs to control Numbers to open your CSV file." "$PLIST"
# Declare CSV explicitly so Finder's "Open with > Change All" accepts this app for .csv files.
/usr/bin/plutil -replace CFBundleDocumentTypes -json '[{"CFBundleTypeName":"CSV document","CFBundleTypeRole":"Editor","CFBundleTypeExtensions":["csv"],"LSItemContentTypes":["public.comma-separated-values-text"],"LSHandlerRank":"Alternate"},{"CFBundleTypeRole":"Viewer","CFBundleTypeExtensions":["*"],"CFBundleTypeOSTypes":["****"]}]' "$PLIST"

cp -R "$QA" "$APP/Contents/Resources/"
/usr/bin/xattr -cr "$APP"
/usr/bin/codesign --force --deep -s - "$APP"
/usr/bin/codesign -v "$APP"
/usr/bin/ditto --noextattr --norsrc "$APP" "dist/CSV to Numbers.app"
echo "Built dist/CSV to Numbers.app"

if [ "$1" = "--install" ]; then
  if [ -w /Applications ]; then DEST=/Applications; else DEST="$HOME/Applications"; mkdir -p "$DEST"; fi
  rm -rf "/Applications/CSV to Numbers.app" "$HOME/Applications/CSV to Numbers.app" 2>/dev/null || true
  /usr/bin/ditto "$APP" "$DEST/CSV to Numbers.app"
  /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$DEST/CSV to Numbers.app" >/dev/null 2>&1 || true
  echo "Installed to $DEST/CSV to Numbers.app (open it once to add the Quick Action)"
fi
