/**
 * Backend spreadsheet untuk Silsilah Keluarga.
 *
 * Cara pakai:
 * 1. Buka Google Sheet kosong -> Extensions -> Apps Script.
 * 2. Tempel seluruh kode ini, simpan.
 * 3. Deploy -> New deployment -> Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Salin URL berakhiran /exec ke APPS_SCRIPT_URL di Vercel.
 */

var SHEET_NAME = 'silsilah';
var HEADERS = ['id', 'nama', 'gender', 'ayah_id', 'ibu_id', 'pasangan_id', 'lahir', 'wafat', 'catatan'];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readAll_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var people = [];
  values.forEach(function (row) {
    if (!row[0]) return;
    var p = {};
    HEADERS.forEach(function (h, i) {
      p[h] = row[i] === null || row[i] === undefined ? '' : String(row[i]);
    });
    people.push(p);
  });
  return people;
}

function doGet() {
  try {
    return json_({ people: readAll_(getSheet_()) });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var body = JSON.parse(e.postData.contents);
    var sh = getSheet_();
    var last = sh.getLastRow();
    var ids = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];

    if (body.action === 'upsert') {
      var p = body.person;
      var row = HEADERS.map(function (h) { return p[h] === undefined ? '' : p[h]; });
      var idx = ids.indexOf(String(p.id));
      if (idx >= 0) {
        sh.getRange(idx + 2, 1, 1, HEADERS.length).setValues([row]);
      } else {
        sh.appendRow(row);
      }
      return json_({ ok: true });
    }

    if (body.action === 'delete') {
      var delIdx = ids.indexOf(String(body.id));
      if (delIdx >= 0) sh.deleteRow(delIdx + 2);

      // Bersihkan referensi ke orang yang dihapus
      var after = sh.getLastRow();
      if (after >= 2) {
        var range = sh.getRange(2, 1, after - 1, HEADERS.length);
        var vals = range.getValues();
        var changed = false;
        vals.forEach(function (r) {
          [3, 4, 5].forEach(function (c) {
            if (String(r[c]) === String(body.id)) {
              r[c] = '';
              changed = true;
            }
          });
        });
        if (changed) range.setValues(vals);
      }
      return json_({ ok: true });
    }

    return json_({ error: 'Aksi tidak dikenal' });
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
