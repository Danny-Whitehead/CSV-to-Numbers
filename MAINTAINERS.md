# Maintainers

## How it fits together
- `CSV to Numbers.js` holds the conversion logic.
- `App Entry.js` holds the app entry points. `build-app.sh` appends it to `CSV to Numbers.js` and compiles the result into the app.
- `quick-action/` is the right-click Quick Action. It only runs `open -b com.automation.csvtonumbers "$@"`, so it depends on the app and does nothing without it.
- The Quick Action is bundled inside the app and copied to `~/Library/Services` whenever the app is opened (or a CSV is opened with it).

The app is self-contained. Give users the app only, never the Quick Action separately.

## Building and releasing
- `./build-app.sh` builds `dist/CSV to Numbers.app`.
- `./build-app.sh --install` also installs it.
- Push a version tag and GitHub Actions builds the app and publishes the release:
  `git tag v1.0.1 && git push origin v1.0.1`

The build needs only macOS (`osacompile`, `plutil`, `codesign`).

## Colleague guide (PDF)
`guide/guide.html` is the source of the printable user guide. After editing it (or the README's user
instructions, which it mirrors), run `guide/build-guide.sh` to regenerate `guide/CSV to Numbers - Guide.pdf`
(needs Google Chrome). Share the PDF alongside `CSV-to-Numbers.zip`.

## Behaviour
- Converts the CSV to a temporary `.xlsx` with every cell as text, then opens it in Numbers. Nothing is left next to the CSV.
- Handles UTF-8 (with or without BOM) and Windows-1252 files; comma, semicolon or tab delimiters; quoted fields and line breaks inside cells.

## Known limitations
- **The default new-document template is NOT applied.** Applying it means pasting into a new document, which needs the Accessibility permission. In testing, Numbers still converted some pasted cells (`00123` became `123`) even with the cells formatted as Text. That code is still in `CSV to Numbers.js` but switched off (`DIRECT_PASTE = false`). Don't enable it without re-testing on real data.
- Numbers has no bulk-fill scripting (about 50 cells/second), so cells can't be filled directly.
- The app is ad-hoc signed only, not notarised (that needs a paid Apple Developer account), hence the one-off "Open Anyway" step for users.
