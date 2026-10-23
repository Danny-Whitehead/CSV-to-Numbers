// Launcher for "CSV to Numbers". Intentionally tiny and rarely changed: it loads the real logic from
// ~/Library/Application Support/CSV to Numbers/CSV to Numbers.js so that updating the logic does not
// change this app (and therefore does not reset the permissions macOS granted to it).

ObjC.import("Foundation");

function load() {
  if (typeof processAll === "function") return;
  const path = ObjC.unwrap($.NSHomeDirectory()) + "/Library/Application Support/CSV to Numbers/CSV to Numbers.js";
  const src = $.NSString.stringWithContentsOfFileEncodingError(path, 4, null);
  if (!src || src.isNil()) throw new Error("Cannot find " + path + ". Run Install.command again.");
  (0, eval)(ObjC.unwrap(src));
}

function run() {
  load();
  chooseAndProcess();
}

function openDocuments(docs) {
  load();
  processAll(docs.map(String));
}
