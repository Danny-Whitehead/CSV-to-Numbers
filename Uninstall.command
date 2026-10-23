#!/bin/bash
# Removes everything Install.command added: the app, the script and the Finder Quick Action.
# It does not change which app opens CSV files; if you set CSV to Numbers as the default,
# choose another app via Get Info (Command-I) > Open with > Change All.

for APP in "/Applications/CSV to Numbers.app" "$HOME/Applications/CSV to Numbers.app"; do
  if [ -e "$APP" ]; then
    rm -rf "$APP" && echo "Removed $APP" || echo "Could not remove $APP (try from an admin account)"
  fi
done

rm -rf "$HOME/Library/Application Support/CSV to Numbers" && echo "Removed script folder"
rm -rf "$HOME/Library/Services/Open in Numbers (as text).workflow" && echo "Removed Quick Action"
/System/Library/CoreServices/pbs -update >/dev/null 2>&1 || true

echo "Done."
