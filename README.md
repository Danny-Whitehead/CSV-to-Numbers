# CSV to Numbers (text-safe)

Opens CSV exports in Numbers **without** Numbers converting SKUs to numbers
(`00123` stays `00123`, `1234500` keeps its zeros).

## Using it
- Right-click a CSV in Finder → **Quick Actions → Open in Numbers (as text)**, or
- Drag CSVs onto `/Applications/CSV to Numbers.app`, or
- (Optional) Get Info on a CSV → Open with → *CSV to Numbers* → Change All, then double-click any CSV.

It converts the CSV to a temporary `.xlsx` in which every cell is text and opens that in Numbers.
No files are left next to the CSV. Needs no extra permissions or prompts.
Every cell is text, so if you need to calculate on a price/quantity column, change that column's
format to Number in Numbers. **Leave the SKU column as Text.**

## Installing (any Mac, nothing but macOS and Numbers needed)
1. Download the latest `CSV-to-Numbers-vX.Y.Z.zip` from the [Releases](../../releases) page and unzip it.
2. Double-click `Install.command`. Because it was downloaded and isn't notarised by Apple, macOS will
   say it "could not verify" it. To allow it, either:
   - click **Done**, then **System Settings → Privacy & Security → Open Anyway** (next to
     "Install.command was blocked"), or
   - in Terminal, from the unzipped folder, run `xattr -dr com.apple.quarantine .` and double-click again.
   (On macOS 15 and later, right-click → Open no longer bypasses this.)

It copies the script to `~/Library/Application Support/CSV to Numbers/`, builds
`/Applications/CSV to Numbers.app` (or `~/Applications` on a standard, non-admin account that can't
write to `/Applications`) and adds the Quick Action. Run it again after editing `CSV to Numbers.js`.
To remove everything, run `Uninstall.command`.

Requires macOS and Apple Numbers. Nothing else (no Python, no Homebrew, no LibreOffice).

## Making CSV files open this way by default
Select any `.csv` file, press **⌘I**, choose *CSV to Numbers* under **Open with**, then **Change All…**.

## Not done / known limitations
- **Your default new-document template is NOT applied.** The result is the xlsx import, with Numbers'
  own table styling. Applying a template means pasting into a new document, which needs the
  Accessibility permission, and in testing Numbers still converted some pasted cells (`00123`
  became `123`) even with the cells formatted as Text. That code is still in `CSV to Numbers.js`
  but switched off (`DIRECT_PASTE = false`). Don't enable it without re-testing on real data.
  Workaround: copy the table from the opened file into a new document (Numbers-to-Numbers copy keeps text as text).
- Numbers has no bulk-fill scripting (about 50 cells/second), so it can't be filled directly.
- The app is not code-signed or notarised, hence the one-off "Open Anyway" step when first installing.

## Releasing (maintainers)
Push a version tag and GitHub Actions builds the zip and publishes the release:
`git tag v1.0.0 && git push origin v1.0.0`

## Notes
- Source: `CSV to Numbers.js` (logic) and `Launcher.js` (the tiny app).
- Handles UTF-8 (with/without BOM) and Windows-1252 files; comma, semicolon or tab delimiters; quoted fields and line breaks inside cells.

## Licence
[MIT](LICENSE)
