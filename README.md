# CSV to Numbers

Opens CSV files in Apple Numbers **without** Numbers changing your SKUs.
`00123` stays `00123`, and `1234500` keeps its zeros.

Needs a Mac with Numbers. Nothing else to install.

## Install (2 minutes)
1. Download `CSV-to-Numbers.zip` from the [latest release](../../releases/latest) and double-click it to unzip.
2. Drag **CSV to Numbers** into your **Applications** folder.
3. Open **CSV to Numbers** from Applications. macOS will warn that it "could not verify" the app. This is expected, because the app isn't from the App Store. Click **Done**, then:
   1. Open **System Settings → Privacy & Security**.
   2. Scroll down and click **Open Anyway** next to "CSV to Numbers was blocked".
   3. Enter your Mac password and click **Open**.
4. A small window appears confirming it's ready. Click **Done**.

You only do this once. If **Open Anyway** doesn't appear, see [Troubleshooting](#troubleshooting).

## Use
Pick whichever you prefer:
- **Right-click a CSV** in Finder → **Quick Actions → Open in Numbers (as text)**.
- **Drag CSV files** onto the app.
- **Double-click a CSV**, once you've made this app the default (see below).

The file opens in Numbers with every cell as text. Your original CSV isn't changed, and no extra files are left behind.

### Make double-click work for CSV files (optional)
1. Click any `.csv` file once and press **⌘ + I**.
2. Under **Open with**, choose **CSV to Numbers**.
3. Click **Change All…** and confirm.

To undo this, repeat the steps and choose another app.

## Things to know
- **Everything opens as text.** To add up a price or quantity column, select it and change its format to **Number**. **Leave the SKU column as Text.**
- The file opens with Numbers' standard table styling, not your own default template. To use your template, copy the table into a new document. Copying from Numbers to Numbers keeps the text as it is.
- Files saved with commas, semicolons or tabs all work, as do Excel-style special characters.

## Troubleshooting
| Problem | What to do |
|---|---|
| **Open Anyway** isn't in System Settings | Open **Terminal** and run `xattr -dr com.apple.quarantine "/Applications/CSV to Numbers.app"`, then open the app again. |
| No right-click option | Open **CSV to Numbers** once from Applications. If it's still missing, go to **System Settings → Privacy & Security → Extensions → Finder** and enable **Open in Numbers (as text)**. |
| The right-click option does nothing | The app has been moved or deleted. Put **CSV to Numbers** back in Applications. |
| Zeros are still being dropped | Check you opened the file with this app or the right-click option, not by double-clicking while Numbers is the default. |

## Uninstall
Drag **CSV to Numbers** from Applications to the Bin, then delete
`~/Library/Services/Open in Numbers (as text).workflow`.

## For developers
See [MAINTAINERS.md](MAINTAINERS.md) for how to build, release and change the app.

## Licence
[MIT](LICENSE)
