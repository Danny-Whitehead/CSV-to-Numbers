# CSV to Numbers (text-safe)

Opens stok.ly CSV exports in Numbers **without** Numbers converting SKUs to numbers
(`00123` stays `00123`, `1234500` keeps its zeros).

## Using it
- Right-click a CSV in Finder → **Quick Actions → Open in Numbers (as text)**, or
- Drag CSVs onto `/Applications/CSV to Numbers.app`, or
- (Optional) Get Info on a CSV → Open with → *CSV to Numbers* → Change All, then double-click any CSV.

It converts the CSV to a temporary `.xlsx` in which every cell is text and opens that in Numbers.
No files are left next to the CSV. Needs no extra permissions or prompts.
Every cell is text, so if you need to calculate on a price/quantity column, change that column's
format to Number in Numbers. **Leave the SKU column as Text.**
When finished, File → Export To → CSV in Numbers for re-import to stok.ly.

## Installing (any Mac, nothing but macOS and Numbers needed)
Double-click `Install.command` (right-click → Open the first time if macOS objects). It copies the
script to `~/Library/Application Support/CSV to Numbers/`, builds `/Applications/CSV to Numbers.app`
(or `~/Applications` on a standard, non-admin account that can't write to `/Applications`)
and adds the Quick Action. Run it again after editing `CSV to Numbers.js`.

## Not done / known limitations
- **Your default template styling is NOT applied.** The result is the xlsx import, with Numbers'
  own table styling. Applying a template means pasting into a new document, which needs the
  Accessibility permission, and in testing Numbers still converted some pasted cells (`00123`
  became `123`) even with the cells formatted as Text. That code is still in `CSV to Numbers.js`
  but switched off (`DIRECT_PASTE = false`). Don't enable it without re-testing on real data.
- Numbers has no bulk-fill scripting (about 50 cells/second), so it can't be filled directly.

## Notes
- Source: `CSV to Numbers.js` (logic) and `Launcher.js` (the tiny app).
- Handles UTF-8 (with/without BOM) and Windows-1252 files; comma, semicolon or tab delimiters; quoted fields and line breaks inside cells.
