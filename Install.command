#!/bin/bash
# Installs "CSV to Numbers" for the current user:
#   - copies the logic to ~/Library/Application Support/CSV to Numbers/
#   - builds ~/Applications/CSV to Numbers.app (a small launcher) if it isn't already there
#   - adds a Finder right-click Quick Action: Quick Actions > "Open in Numbers (as text)"
# Needs nothing but macOS and Numbers. Safe to run again to update: the app is only rebuilt when
# missing (or with --rebuild), because rebuilding resets the Accessibility permission macOS granted it.

set -e
cd "$(dirname "$0")"

APP_ID="com.automation.csvtonumbers"
# Install to /Applications. Standard (non-admin) accounts can't write there, so fall back to ~/Applications.
if [ -w "/Applications" ]; then APP_DIR="/Applications"; else APP_DIR="$HOME/Applications"; fi
APP="$APP_DIR/CSV to Numbers.app"
SUPPORT="$HOME/Library/Application Support/CSV to Numbers"
SERVICE="$HOME/Library/Services/Open in Numbers (as text).workflow"

mkdir -p "$APP_DIR" "$HOME/Library/Services" "$SUPPORT"

echo "Installing script ..."
cp -f "CSV to Numbers.js" "$SUPPORT/CSV to Numbers.js"

if [ ! -d "$APP" ] || [ "$1" = "--rebuild" ]; then
  echo "Building $APP ..."
  # Remove any other copy so there is only one app with this identifier.
  for OTHER in "/Applications/CSV to Numbers.app" "$HOME/Applications/CSV to Numbers.app"; do
    [ "$OTHER" != "$APP" ] && rm -rf "$OTHER"
  done
  rm -rf "$APP"
  /usr/bin/osacompile -l JavaScript -o "$APP" "Launcher.js"
  /usr/bin/plutil -replace CFBundleIdentifier -string "$APP_ID" "$APP/Contents/Info.plist"
  # Declare CSV explicitly so Finder's "Open with > Change All" accepts this app for .csv files.
  /usr/bin/plutil -replace CFBundleDocumentTypes -json '[{"CFBundleTypeName":"CSV document","CFBundleTypeRole":"Editor","CFBundleTypeExtensions":["csv"],"LSItemContentTypes":["public.comma-separated-values-text"],"LSHandlerRank":"Alternate"},{"CFBundleTypeRole":"Viewer","CFBundleTypeExtensions":["*"],"CFBundleTypeOSTypes":["****"]}]' "$APP/Contents/Info.plist"
  /usr/bin/plutil -replace NSAppleEventsUsageDescription -string "CSV to Numbers needs to control Numbers to open your CSV file." "$APP/Contents/Info.plist"
  /usr/bin/xattr -cr "$APP"
  /usr/bin/codesign --force --deep -s - "$APP"
  /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP" >/dev/null 2>&1 || true
else
  echo "App already installed - kept as is (use --rebuild to rebuild)."
fi

echo "Installing Quick Action ..."
rm -rf "$SERVICE"
mkdir -p "$SERVICE/Contents"

cat > "$SERVICE/Contents/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSServices</key>
	<array>
		<dict>
			<key>NSBackgroundColorName</key>
			<string>background</string>
			<key>NSIconName</key>
			<string>NSActionTemplate</string>
			<key>NSMenuItem</key>
			<dict>
				<key>default</key>
				<string>Open in Numbers (as text)</string>
			</dict>
			<key>NSMessage</key>
			<string>runWorkflowAsService</string>
			<key>NSRequiredContext</key>
			<dict>
				<key>NSApplicationIdentifier</key>
				<string>com.apple.finder</string>
			</dict>
			<key>NSSendFileTypes</key>
			<array>
				<string>public.comma-separated-values-text</string>
			</array>
		</dict>
	</array>
</dict>
</plist>
EOF

cat > "$SERVICE/Contents/document.wflow" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>AMApplicationBuild</key>
	<string>523</string>
	<key>AMApplicationVersion</key>
	<string>2.10</string>
	<key>AMDocumentVersion</key>
	<string>2</string>
	<key>actions</key>
	<array>
		<dict>
			<key>action</key>
			<dict>
				<key>AMAccepts</key>
				<dict>
					<key>Container</key>
					<string>List</string>
					<key>Optional</key>
					<true/>
					<key>Types</key>
					<array>
						<string>com.apple.cocoa.string</string>
					</array>
				</dict>
				<key>AMActionVersion</key>
				<string>2.0.3</string>
				<key>AMApplication</key>
				<array>
					<string>Automator</string>
				</array>
				<key>AMParameterProperties</key>
				<dict>
					<key>COMMAND_STRING</key>
					<dict/>
					<key>CheckedForUserDefaultShell</key>
					<dict/>
					<key>inputMethod</key>
					<dict/>
					<key>shell</key>
					<dict/>
					<key>source</key>
					<dict/>
				</dict>
				<key>AMProvides</key>
				<dict>
					<key>Container</key>
					<string>List</string>
					<key>Types</key>
					<array>
						<string>com.apple.cocoa.string</string>
					</array>
				</dict>
				<key>ActionBundlePath</key>
				<string>/System/Library/Automator/Run Shell Script.action</string>
				<key>ActionName</key>
				<string>Run Shell Script</string>
				<key>ActionParameters</key>
				<dict>
					<key>COMMAND_STRING</key>
					<string>/usr/bin/open -b com.automation.csvtonumbers "$@"</string>
					<key>CheckedForUserDefaultShell</key>
					<true/>
					<key>inputMethod</key>
					<integer>1</integer>
					<key>shell</key>
					<string>/bin/zsh</string>
					<key>source</key>
					<string></string>
				</dict>
				<key>BundleIdentifier</key>
				<string>com.apple.RunShellScript</string>
				<key>CFBundleVersion</key>
				<string>2.0.3</string>
				<key>CanShowSelectedItemsWhenRun</key>
				<false/>
				<key>CanShowWhenRun</key>
				<true/>
				<key>Category</key>
				<array>
					<string>AMCategoryUtilities</string>
				</array>
				<key>Class Name</key>
				<string>RunShellScriptAction</string>
				<key>InputUUID</key>
				<string>5C1B7A31-0E0A-4B0B-9B79-3E3B5E1D0A11</string>
				<key>OutputUUID</key>
				<string>8D0E2F52-4C1F-4D3A-8E55-6F7A9B2C3D22</string>
				<key>UUID</key>
				<string>2A9C4E73-6B2D-4F18-A1C4-0D5E7F8A9B33</string>
				<key>UnlocalizedApplications</key>
				<array>
					<string>Automator</string>
				</array>
				<key>arguments</key>
				<dict/>
				<key>isViewVisible</key>
				<integer>1</integer>
				<key>location</key>
				<string>309.000000:253.000000</string>
				<key>nibPath</key>
				<string>/System/Library/Automator/Run Shell Script.action/Contents/Resources/Base.lproj/main.nib</string>
			</dict>
			<key>isViewVisible</key>
			<integer>1</integer>
		</dict>
	</array>
	<key>connectors</key>
	<dict/>
	<key>workflowMetaData</key>
	<dict>
		<key>applicationBundleIDsByPath</key>
		<dict/>
		<key>applicationPaths</key>
		<array/>
		<key>inputTypeIdentifier</key>
		<string>com.apple.Automator.fileSystemObject</string>
		<key>outputTypeIdentifier</key>
		<string>com.apple.Automator.nothing</string>
		<key>presentationMode</key>
		<integer>15</integer>
		<key>processesInput</key>
		<false/>
		<key>serviceInputTypeIdentifier</key>
		<string>com.apple.Automator.fileSystemObject</string>
		<key>serviceOutputTypeIdentifier</key>
		<string>com.apple.Automator.nothing</string>
		<key>serviceProcessesInput</key>
		<false/>
		<key>systemImageName</key>
		<string>NSActionTemplate</string>
		<key>useAutomaticInputType</key>
		<false/>
		<key>workflowTypeIdentifier</key>
		<string>com.apple.Automator.servicesMenu</string>
	</dict>
</dict>
</plist>
EOF

/usr/bin/plutil -lint "$SERVICE/Contents/Info.plist" "$SERVICE/Contents/document.wflow"
/System/Library/CoreServices/pbs -update >/dev/null 2>&1 || true

echo
echo "Done."
echo " - App:          $APP"
echo " - Quick Action: right-click a CSV in Finder > Quick Actions > Open in Numbers (as text)"
echo
echo "First run: macOS will ask you to allow CSV to Numbers to control Numbers and System Events,"
echo "and to enable it in System Settings > Privacy & Security > Accessibility (needed to paste)."
