# CSV to Numbers (text-safe)

Opens CSV exports in Numbers **without** Numbers converting SKUs to numbers
(`00123` stays `00123`, `1234500` keeps its zeros).

## Using it
- **Double-click a CSV** (once you've set this app as the default for CSV files, see below), or
- Right-click a CSV in Finder → **Quick Actions → Open in Numbers (as text)**, or
- Drag CSVs onto the app.

It converts the CSV to a temporary `.xlsx` in which every cell is text and opens that in Numbers.
No files are left next to the CSV. Needs no extra permissions or prompts.
Every cell is text, so if you need to calculate on a price/quantity column, change that column's
format to Number in Numbers. **Leave the SKU column as Text.**

## Installing (any Mac, nothing but macOS and Numbers needed)
1. Download `CSV-to-Numbers.zip` from the [latest release](../../releases/latest) and unzip it.
2. Drag **CSV to Numbers** into your **Applications** folder.
3. Open it. macOS will say it "could not verify" the app, because it isn't notarised by Apple
   (that needs a paid Apple Developer account). Click **Done**, then go to
   **System Settings → Privacy & Security**, scroll down and click **Open Anyway** next to
   "CSV to Numbers was blocked", and confirm with your password.
   If **Open Anyway** doesn't appear, run this once in Terminal and open the app again:
   `xattr -dr com.apple.quarantine "/Applications/CSV to Numbers.app"`
4. Opening the app also adds the right-click Quick Action. (If the Quick Action doesn't show up,
   enable it in System Settings → Privacy & Security → Extensions → Finder.)

To uninstall: drag the app to the Bin and delete
`~/Library/Services/Open in Numbers (as text).workflow`.

Requires macOS and Apple Numbers. Nothing else (no Python, no Homebrew, no LibreOffice).

## Making CSV files open this way by default
Select any `.csv` file, press **⌘I**, choose *CSV to Numbers* under **Open with**, then **Change All…**.
To go back, do the same and choose another app.

## Not done / known limitations
- **Your default new-document template is NOT applied.** The result is the xlsx import, with Numbers'
  own table styling. Applying a template means pasting into a new document, which needs the
  Accessibility permission, and in testing Numbers still converted some pasted cells (`00123`
  became `123`) even with the cells formatted as Text. That code is still in `CSV to Numbers.js`
  but switched off (`DIRECT_PASTE = false`). Don't enable it without re-testing on real data.
  Workaround: copy the table from the opened file into a new document (Numbers-to-Numbers copy keeps text as text).
- Numbers has no bulk-fill scripting (about 50 cells/second), so it can't be filled directly.
- The app is not code-signed or notarised, hence the one-off "Open Anyway" step.

## Building and releasing (maintainers)
- `./build-app.sh` builds `dist/CSV to Numbers.app`; `./build-app.sh --install` also installs it.
- Push a version tag and GitHub Actions builds the app and publishes the release:
  `git tag v1.0.1 && git push origin v1.0.1`

## Notes
- Source: `CSV to Numbers.js` (logic), `App Entry.js` (app entry points) and `quick-action/` (the right-click
  action, bundled into the app by `build-app.sh`).
- Handles UTF-8 (with/without BOM) and Windows-1252 files; comma, semicolon or tab delimiters; quoted fields and line breaks inside cells.

## Licence
[MIT](LICENSE)
