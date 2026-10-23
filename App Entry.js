// Entry points for the self-contained "CSV to Numbers" app.
// build-app.sh appends this file to "CSV to Numbers.js" before compiling, so the app needs
// no other files. The right-click Quick Action is bundled inside the app and copied into
// ~/Library/Services whenever the app is opened.

const QA_NAME = "Open in Numbers (as text).workflow";

function ensureQuickAction(force) {
  const fm = $.NSFileManager.defaultManager;
  const home = ObjC.unwrap($.NSHomeDirectory());
  const src = ObjC.unwrap($.NSBundle.mainBundle.resourcePath) + "/" + QA_NAME;
  const dest = home + "/Library/Services/" + QA_NAME;
  if (!fm.fileExistsAtPath(src)) return false;
  if (!force && fm.fileExistsAtPath(dest)) return true;
  app.doShellScript(
    "/bin/mkdir -p " + q(home + "/Library/Services") +
    " && /bin/rm -rf " + q(dest) + " && /bin/cp -R " + q(src) + " " + q(dest) +
    "; /System/Library/CoreServices/pbs -update >/dev/null 2>&1 || true"
  );
  return true;
}

// Double-clicking the app itself (not a CSV).
function run() {
  let installed = false;
  try { installed = ensureQuickAction(true); } catch (e) {}
  let choice;
  try {
    choice = app.displayDialog(
      "CSV to Numbers opens CSV files in Numbers with every cell as text, so SKUs keep their zeros.\n\n" +
      "Use it by:\n" +
      "\u2022 double-clicking a CSV (if you've set this app as the default for CSV files),\n" +
      "\u2022 dropping CSV files onto this app, or\n" +
      (installed ? "\u2022 right-clicking a CSV in Finder \u2192 Quick Actions \u2192 Open in Numbers (as text).\n" : ""),
      { buttons: ["Done", "Choose CSV\u2026"], defaultButton: "Choose CSV\u2026", withTitle: "CSV to Numbers" }
    );
  } catch (e) { return; }
  if (choice.buttonReturned !== "Done") chooseAndProcess();
}

function openDocuments(docs) {
  try { ensureQuickAction(false); } catch (e) {}
  processAll(docs.map(String));
}
