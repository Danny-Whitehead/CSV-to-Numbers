// CSV to Numbers (text-safe)
// Opens a CSV in a NEW Numbers document (your default template) with every cell stored as text,
// so SKUs such as 00123 or 1234500 are never turned into numbers.
//
// This file is the logic. It is loaded by the small launcher app (Launcher.js), which calls
// chooseAndProcess() or processAll(paths). Keeping the logic outside the app means updating it
// doesn't change the app, so the macOS permissions granted to the app are kept.
//
// How: create a new document, size its table to the CSV, format all cells as Text, then paste the
// CSV (as tab-separated text) from the clipboard. Pasting needs the one-time macOS Accessibility
// permission. Without it, falls back to writing an .xlsx (all text) and opening that instead.
// Uses only tools that ship with macOS (JavaScript for Automation + /usr/bin/zip).

ObjC.import("Foundation");
ObjC.import("AppKit");
ObjC.import("ApplicationServices");

// Leave empty to use Numbers' default new-document template, or set a template name
// exactly as shown in Numbers' template chooser (e.g. "My Product Template").
const TEMPLATE_NAME = "";

// EXPERIMENTAL and OFF: pasting straight into a new Numbers document needs the macOS Accessibility
// permission, and in testing Numbers still converted some cells (e.g. 00123 became 123), so the
// reliable .xlsx route is used instead. Leave false unless the paste route has been fixed.
const DIRECT_PASTE = false;
const CLIPBOARD_MODE = "tsv"; // "tsv" or "html"

const app = Application.currentApplication();
app.includeStandardAdditions = true;

function chooseAndProcess() {
  const picked = app.chooseFile({
    withPrompt: "Choose CSV file(s) to open in Numbers as text",
    multipleSelectionsAllowed: true,
  });
  processAll((Array.isArray(picked) ? picked : [picked]).map(String));
}

function processAll(paths) {
  const errors = [];
  let noPermission = false;
  for (const p of paths) {
    try {
      const rows = parseCSV(readText(p));
      if (!rows.length) throw new Error("file is empty");
      if (DIRECT_PASTE && !noPermission && openDirect(rows)) continue;
      if (DIRECT_PASTE && !noPermission) {
        noPermission = true;
        app.displayDialog(
          "Accessibility permission for \"CSV to Numbers\" wasn't granted, so the file can't be " +
          "pasted straight into a new Numbers document. It will be opened via an .xlsx copy.",
          { buttons: ["OK"], withIcon: "caution", givingUpAfter: 20 }
        );
      }
      const out = convert(p, rows);
      app.doShellScript("/usr/bin/open -b com.apple.Numbers " + q(out));
    } catch (e) {
      errors.push(p.split("/").pop() + ": " + e.message);
    }
  }
  if (errors.length) {
    app.displayDialog("Could not convert:\n\n" + errors.join("\n"), {
      buttons: ["OK"],
      withIcon: "stop",
    });
  }
}

// Diagnostic log: /tmp/csv-to-numbers.log
function log(msg) {
  try {
    const line = new Date().toISOString() + "  " + msg + "\n";
    const fh = $.NSFileHandle.fileHandleForWritingAtPath("/tmp/csv-to-numbers.log");
    if (fh && !fh.isNil()) {
      fh.seekToEndOfFile;
      fh.writeData($(line).dataUsingEncoding(4));
      fh.closeFile;
    } else {
      $(line).writeToFileAtomicallyEncodingError("/tmp/csv-to-numbers.log", true, 4, null);
    }
  } catch (e) {}
}

// JXA can't set Numbers' cell format enum reliably, so this one step runs as AppleScript.
function setTextFormat(docName) {
  const err = Ref();
  $.NSAppleScript.alloc.initWithSource(
    'tell application id "com.apple.Numbers" to set format of cell range of table 1 of sheet 1 of document "' +
    docName.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '" to text'
  ).executeAndReturnError(err);
  if (err[0] && !err[0].isNil()) throw new Error("could not set text format: " + ObjC.unwrap(err[0].description));
}

function tsvField(s) {
  return /[\t\n\r"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function norm(s) {
  return (s == null ? "" : String(s)).replace(/\r\n?/g, "\n");
}

// Returns true when the data was pasted and verified; false if Accessibility permission is missing.
function openDirect(rows) {
  const nrows = rows.length;
  const ncols = rows.reduce((m, r) => Math.max(m, r.length), 1);
  const tsv = rows
    .map((r) => {
      const cells = r.map(tsvField);
      while (cells.length < ncols) cells.push("");
      return cells.join("\t");
    })
    .join("\n") + "\n";

  const numbers = Application("com.apple.Numbers");
  const events = Application("System Events");
  const pb = $.NSPasteboard.generalPasteboard;
  const previous = pb.stringForType($.NSPasteboardTypeString);

  // Fail fast (before creating a document) if Accessibility isn't allowed. The prompting call
  // shows the macOS permission prompt and adds this app to System Settings > Privacy & Security >
  // Accessibility. Stay alive while the user answers it, then carry on automatically.
  if (!$.AXIsProcessTrusted()) {
    $.AXIsProcessTrustedWithOptions($({ AXTrustedCheckOptionPrompt: true }));
    for (let i = 0; i < 120 && !$.AXIsProcessTrusted(); i++) delay(1);
    if (!$.AXIsProcessTrusted()) return false;
  }

  const doc = TEMPLATE_NAME
    ? numbers.Document({ documentTemplate: numbers.templates.byName(TEMPLATE_NAME) })
    : numbers.Document();
  numbers.documents.push(doc);
  delay(2);
  const table = doc.sheets[0].tables[0];

  try {
    table.rowCount = nrows;
    table.columnCount = ncols;
    try { table.headerColumnCount = 0; } catch (e) {}
    try { table.footerRowCount = 0; } catch (e) {}
    if (nrows > 1) { try { table.headerRowCount = 1; } catch (e) {} }
    setTextFormat(doc.name());
    table.selectionRange = table.cells[0];

    // In JXA, zero-argument ObjC methods run on property access, so no parentheses.
    pb.clearContents;
    const html = "<html><body><table>" + rows.map((r) => {
      const cells = r.slice();
      while (cells.length < ncols) cells.push("");
      return "<tr>" + cells.map((c) => "<td>" + esc(c).replace(/\r\n|\r|\n/g, "<br>") + "</td>").join("") + "</tr>";
    }).join("") + "</table></body></html>";
    if (CLIPBOARD_MODE === "html") pb.setStringForType($(html), $.NSPasteboardTypeHTML);
    else pb.setStringForType($(tsv), $.NSPasteboardTypeString);

    numbers.activate();
    const proc = events.processes.whose({ bundleIdentifier: "com.apple.Numbers" })[0];
    for (let i = 0; i < 20 && !proc.frontmost(); i++) {
      try { proc.frontmost = true; } catch (e) {}
      delay(0.5);
    }
    delay(1);
    log("frontmost: " + events.processes.whose({ frontmost: true }).name());
    log("selection: " + table.selectionRange().name());
    if (!proc.frontmost()) throw new Error("Numbers did not come to the front");

    // Attempt 1: Edit > Paste from the menu (independent of window focus).
    try {
      proc.menuBars[0].menuBarItems.byName("Edit").menus[0].menuItems.byName("Paste").click();
      log("menu paste clicked");
    } catch (e) {
      log("menu paste failed: " + e.message);
      if (/not allowed|assistive|1002/i.test(e.message)) throw e;
    }
    let started = false;
    for (let i = 0; i < 15 && !started; i++) {
      delay(1);
      try { started = table.cells[0].formattedValue() != null; } catch (e) {}
    }
    // Attempt 2: Command-V.
    if (!started) {
      events.keystroke("v", { using: "command down" });
      log("keystroke sent");
    }
  } catch (e) {
    log("error: " + e.message);
    try { doc.close({ saving: "no" }); } catch (e2) {}
    if (/not allowed|assistive|1002/i.test(e.message)) return false;
    throw e;
  }

  // Wait for the paste to land (last row, first column), up to ~2 minutes.
  const lastRow = nrows - 1;
  let landed = false;
  for (let i = 0; i < 120 && !landed; i++) {
    delay(1);
    try {
      landed = norm(table.rows[lastRow].cells[0].formattedValue()) === norm(rows[lastRow][0]);
    } catch (e) {}
  }
  log("landed=" + landed);

  const problems = verify(table, rows, nrows, ncols);

  if (previous && !previous.isNil()) {
    pb.clearContents;
    pb.setStringForType(previous, $.NSPasteboardTypeString);
  }

  if (!landed || problems.length) {
    app.displayDialog(
      "The data was pasted, but a check against the CSV found differences:\n\n" +
      (problems.length ? problems.slice(0, 5).join("\n") : "Paste did not finish in time.") +
      "\n\nDo not rely on this document without checking it.",
      { buttons: ["OK"], withIcon: "caution" }
    );
  }
  return true;
}

// Compares the first column, first row and last row of the table with the CSV.
function verify(table, rows, nrows, ncols) {
  const problems = [];
  const same = (actual, expected) => norm(actual) === norm(expected);
  try {
    const col = table.columns[0].cells.formattedValue();
    for (let r = 0; r < nrows; r++) {
      if (!same(col[r], rows[r][0])) {
        problems.push("Row " + (r + 1) + ", column A: expected \"" + norm(rows[r][0]) + "\" but found \"" + norm(col[r]) + "\"");
        break;
      }
    }
    for (const r of [0, nrows - 1]) {
      const vals = table.rows[r].cells.formattedValue();
      for (let c = 0; c < ncols; c++) {
        if (!same(vals[c], rows[r][c])) {
          problems.push("Row " + (r + 1) + ", column " + (c + 1) + ": expected \"" + norm(rows[r][c]) + "\" but found \"" + norm(vals[c]) + "\"");
          break;
        }
      }
    }
  } catch (e) {
    problems.push("Could not verify: " + e.message);
  }
  return problems;
}

function q(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

function readText(path) {
  const data = $.NSData.dataWithContentsOfFile(path);
  if (!data || data.isNil()) throw new Error("cannot read file");
  // 4 = UTF-8, 12 = Windows-1252 (fallback for legacy exports)
  let s = $.NSString.alloc.initWithDataEncoding(data, 4);
  if (!s || s.isNil()) s = $.NSString.alloc.initWithDataEncoding(data, 12);
  if (!s || s.isNil()) throw new Error("unsupported text encoding");
  return ObjC.unwrap(s).replace(/^\uFEFF/, "");
}

function detectDelimiter(text) {
  let inQ = false;
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') inQ = !inQ;
    else if (!inQ && (c === "\n" || c === "\r")) break;
    else if (!inQ && c in counts) counts[c]++;
  }
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}

function parseCSV(text) {
  const delim = detectDelimiter(text);
  const rows = [];
  let row = [], field = "", inQ = false;
  const n = text.length;
  for (let i = 0; i < n; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === delim) {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function colName(i) {
  let s = "";
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

function esc(s) {
  return s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sheetXML(rows) {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>',
  ];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    parts.push('<row r="' + (r + 1) + '">');
    for (let c = 0; c < row.length; c++) {
      if (row[c] === "") continue;
      parts.push(
        '<c r="' + colName(c) + (r + 1) + '" t="inlineStr"><is><t xml:space="preserve">' +
        esc(row[c]) + "</t></is></c>"
      );
    }
    parts.push("</row>");
  }
  parts.push("</sheetData></worksheet>");
  return parts.join("");
}

function writeFile(path, content) {
  const ok = $(content).writeToFileAtomicallyEncodingError(path, true, 4, null);
  if (!ok) throw new Error("cannot write " + path);
}

// The fallback .xlsx goes to a temporary folder so no stray files appear next to the CSV.
function uniqueOutput(csvPath) {
  const name = csvPath.split("/").pop().replace(/\.[^./]*$/, "");
  const dir = ObjC.unwrap($.NSTemporaryDirectory()) + "csv-to-numbers-" + ObjC.unwrap($.NSUUID.UUID.UUIDString);
  $.NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(dir, true, $(), null);
  return dir + "/" + name + ".xlsx";
}

function convert(csvPath, rows) {
  const fm = $.NSFileManager.defaultManager;
  const tmp = ObjC.unwrap($.NSTemporaryDirectory()) + "csv2numbers-" + ObjC.unwrap($.NSUUID.UUID.UUIDString);
  fm.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(tmp + "/_rels", true, $(), null);
  fm.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(tmp + "/xl/_rels", true, $(), null);
  fm.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(tmp + "/xl/worksheets", true, $(), null);

  const hdr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  writeFile(tmp + "/[Content_Types].xml", hdr +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    "</Types>");
  writeFile(tmp + "/_rels/.rels", hdr +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>");
  writeFile(tmp + "/xl/workbook.xml", hdr +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>');
  writeFile(tmp + "/xl/_rels/workbook.xml.rels", hdr +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    "</Relationships>");
  writeFile(tmp + "/xl/worksheets/sheet1.xml", sheetXML(rows));

  const out = uniqueOutput(csvPath);
  try {
    app.doShellScript(
      "cd " + q(tmp) + " && /usr/bin/zip -q -X -r " + q(out) + " '[Content_Types].xml' _rels xl"
    );
  } finally {
    fm.removeItemAtPathError(tmp, null);
  }
  return out;
}
