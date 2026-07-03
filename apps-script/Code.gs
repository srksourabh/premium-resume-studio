/**
 * Premium Resume Studio — Google Apps Script + Gemini + Google Sheets.
 *
 * What runs WHERE:
 *   • Gemini (write/improve a profile, bio → JSON)  → native, via UrlFetchApp.
 *   • Council score + archetype                      → native, pure JS below.
 *   • ODT export                                     → native, via Utilities.zip.
 *   • Designed PDF + DOCX (need Chromium/npm)        → the render service
 *     (server/render-server.js deployed on Cloud Run / Render / a VM).
 *
 * SETUP (Extensions → Apps Script, paste this file, then):
 *   1. Project Settings → Script properties:
 *        GEMINI_API_KEY   = <aistudio.google.com/apikey>
 *        RENDER_URL       = https://your-render-service/render   (optional, for PDF/DOCX)
 *        RENDER_TOKEN     = <same as the service's RENDER_TOKEN>  (optional)
 *        DRIVE_FOLDER_ID  = <folder to save outputs>             (optional)
 *   2. Reload the sheet → use the "Resume Studio" menu.
 *
 * SHEET LAYOUT: a header row with at least a `profile_json` column. The render
 * actions read the active row's JSON and write back `score`, `pdf_url`, etc.
 */

var GEMINI_MODEL = 'gemini-2.5-flash'; // use whatever model is current

// ----------------------------------------------------------------------------
// Menu
// ----------------------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Resume Studio')
    .addItem('Score active row (native)', 'menuScoreRow')
    .addItem('Improve active row with Gemini', 'menuImproveRow')
    .addItem('Bio → profile JSON (Gemini)', 'menuBioToJson')
    .addSeparator()
    .addItem('Render active row (PDF + DOCX + ODT)', 'menuRenderRow')
    .addItem('Render all rows', 'menuRenderAll')
    .addItem('Export ODT natively (no service)', 'menuOdtNative')
    .addToUi();
}

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }

function activeRowCol_(header) {
  var sh = SpreadsheetApp.getActiveSheet();
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var col = headers.indexOf(header) + 1;
  if (!col) throw new Error('No "' + header + '" column in row 1.');
  return { sheet: sh, row: sh.getActiveRange().getRow(), col: col, headers: headers };
}
function ensureCol_(sh, headers, name) {
  var i = headers.indexOf(name);
  if (i >= 0) return i + 1;
  var col = headers.length + 1;
  sh.getRange(1, col).setValue(name);
  headers.push(name);
  return col;
}

// ----------------------------------------------------------------------------
// Gemini (native — UrlFetchApp)
// ----------------------------------------------------------------------------
function geminiGenerate_(systemText, userText, wantJson) {
  var key = prop_('GEMINI_API_KEY');
  if (!key) throw new Error('Set GEMINI_API_KEY in Script properties.');
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + key;
  var payload = {
    system_instruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: wantJson ? { response_mime_type: 'application/json' } : {}
  };
  var res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Gemini ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
  var data = JSON.parse(res.getContentText());
  return (data.candidates[0].content.parts || []).map(function (p) { return p.text || ''; }).join('');
}

var SKILL_GUIDANCE =
  'You are the Premium Resume Studio profile engine. Given raw input, output a single JSON ' +
  'object matching the schema (identity{name,headline,location,email,phone,linkedin,website}, ' +
  'summary{short,long}, metrics[{value,label}], current_roles[{company,title,dates,industry,' +
  'highlights[]}], education[], certifications[], core_competencies{group:[...]}, achievements[], ' +
  'awards[], languages[], interests[]). Rules: quantify every bullet (number/%/₹$/scale), start ' +
  'bullets with strong action verbs, never invent facts, keep bullets 8–30 words. Output JSON only.';

function menuBioToJson() {
  var s = activeRowCol_('bio');
  var sh = s.sheet, row = s.row;
  var bio = sh.getRange(row, s.col).getValue();
  if (!bio) throw new Error('Active row has no "bio" text.');
  var json = geminiGenerate_(SKILL_GUIDANCE, 'Turn this into a resume profile JSON:\n\n' + bio, true);
  var outCol = ensureCol_(sh, s.headers, 'profile_json');
  sh.getRange(row, outCol).setValue(json);
  SpreadsheetApp.getActiveSpreadsheet().toast('profile_json written for row ' + row);
}

function menuImproveRow() {
  var s = activeRowCol_('profile_json');
  var sh = s.sheet, row = s.row;
  var current = sh.getRange(row, s.col).getValue();
  var improved = geminiGenerate_(SKILL_GUIDANCE,
    'Improve this profile so the Model Council scores it >85 (quantify bullets, strong verbs, ' +
    'fix placeholders). Return the full improved JSON only:\n\n' + current, true);
  sh.getRange(row, s.col).setValue(improved);
  var score = scoreResumeNative_(JSON.parse(improved)).absolute;
  sh.getRange(row, ensureCol_(sh, s.headers, 'score')).setValue(score);
  SpreadsheetApp.getActiveSpreadsheet().toast('Improved row ' + row + ' — score ' + score);
}

// ----------------------------------------------------------------------------
// Native Model Council (compact port of scripts/lib/council.js)
// ----------------------------------------------------------------------------
var ACTION_VERBS = ('led built scaled drove delivered launched founded architected designed created grew increased ' +
  'reduced saved generated managed directed spearheaded established transformed streamlined optimized negotiated ' +
  'secured won closed shipped owned developed implemented deployed orchestrated pioneered mentored expanded ' +
  'accelerated automated engineered produced published presented awarded achieved exceeded raised acquired ' +
  'coordinated executed initiated championed overhauled consolidated restructured').split(' ');
var QUANT = /(\d[\d,.]*\s*(%|percent|cr|crore|lakh|million|billion|k\b|mn|bn)|[₹$€£]\s?\d|\b\d{2,}\b|\d+\s?(users?|clients?|states?|projects?|teams?|people|resources?|engineers?|stores?|cities|years?|months?))/i;

function allBullets_(p) {
  var b = [];
  (p.current_roles || []).forEach(function (r) { (r.highlights || []).forEach(function (h) { b.push(h); }); });
  (p.past_roles || p.experience || []).forEach(function (r) { (r.highlights || r.bullets || []).forEach(function (h) { b.push(h); }); });
  (p.projects || []).forEach(function (pr) { (pr.highlights || (pr.description ? [pr.description] : [])).forEach(function (h) { b.push(h); }); });
  (p.internships || []).forEach(function (i) { (i.highlights || []).forEach(function (h) { b.push(h); }); });
  return b.filter(Boolean);
}
function words_(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
function clamp_(n) { return Math.max(0, Math.min(100, n)); }

/** Returns { absolute, dimensions } — mirrors the Node council's core weights. */
function scoreResumeNative_(p) {
  var id = p.identity || {};
  var bullets = allBullets_(p);
  var dims = {};

  var contacts = ['email', 'phone', 'location'].filter(function (k) { return id[k]; }).length;
  var links = ['linkedin', 'website', 'portfolio', 'github'].filter(function (k) { return id[k]; }).length;
  dims.contactability = { s: clamp_(contacts / 3 * 70 + Math.min(1, links) * 30), w: 8 };

  var q = bullets.filter(function (b) { return QUANT.test(b); }).length;
  var metrics = (p.metrics || []).length;
  dims.impact = { s: bullets.length ? clamp_((q / bullets.length) * 80 + Math.min(20, metrics * 7)) : 30, w: 18 };

  var strong = bullets.filter(function (b) { return ACTION_VERBS.indexOf(String(b).trim().toLowerCase().split(/[\s,]+/)[0].replace(/[^a-z]/g, '')) >= 0; }).length;
  dims.actionVerbs = { s: bullets.length ? clamp_((strong / bullets.length) * 100) : 40, w: 10 };

  var need = { executive: ['current_roles', 'achievements', 'core_competencies'], academic: ['education', 'publications', 'research'], fresher: ['education', 'projects'] }[classifyNative_(p)] || ['current_roles', 'education'];
  var have = need.filter(function (k) { var v = p[k]; return Array.isArray(v) ? v.length : v && Object.keys(v).length; }).length;
  dims.completeness = { s: clamp_(have / need.length * 100), w: 12 };

  var good = bullets.filter(function (b) { var w = words_(b); return w >= 8 && w <= 30; }).length;
  dims.brevity = { s: bullets.length ? clamp_(good / bullets.length * 100) : 60, w: 8 };

  var hits = (JSON.stringify({ i: id, r: p.current_roles, e: p.education }).match(/pending|tbd|placeholder|unknown|null/gi) || []).length;
  dims.credibility = { s: clamp_(100 - hits * 9 - (p.pending_confirmations || []).length * 3), w: 10 };

  var pos = 0; var h = id.headline || '';
  if (h) pos += 45; if (words_(h) >= 4 && words_(h) <= 16) pos += 30; if (p.summary && (p.summary.long || p.summary.short)) pos += 25;
  dims.positioning = { s: clamp_(pos), w: 10 };

  var skills = p.core_competencies ? [].concat.apply([], Object.keys(p.core_competencies).map(function (k) { return p.core_competencies[k]; })) : [];
  dims.atsCoverage = { s: clamp_(Math.min(80, skills.length * 3.5) + 10), w: 10 };

  var tw = 0, sw = 0;
  Object.keys(dims).forEach(function (k) { tw += dims[k].w; sw += dims[k].s * dims[k].w; });
  return { absolute: Math.round(sw / tw * 10) / 10, dimensions: dims };
}

function classifyNative_(p) {
  var blob = JSON.stringify(p).toLowerCase();
  if ((p.publications || []).length || /ph\.?d|professor|postdoc|research fellow/.test(blob)) return 'academic';
  var roles = (p.current_roles || []).length + (p.past_roles || p.experience || []).length;
  if (roles <= 1 && ((p.internships || []).length || (p.projects || []).length) && /fresher|graduate|entry|intern/.test(blob)) return 'fresher';
  if (/ceo|founder|co-?founder|managing director|chief|chairman|director|president|\bvp\b/.test(blob)) return 'executive';
  return 'general';
}

/** Custom function: =RESUME_SCORE(A2)  where A2 holds profile JSON. Pure — no auth. */
function RESUME_SCORE(profileJson) {
  try { return scoreResumeNative_(typeof profileJson === 'string' ? JSON.parse(profileJson) : profileJson).absolute; }
  catch (e) { return 'ERR: ' + e.message; }
}

function menuScoreRow() {
  var s = activeRowCol_('profile_json');
  var p = JSON.parse(s.sheet.getRange(s.row, s.col).getValue());
  var r = scoreResumeNative_(p);
  s.sheet.getRange(s.row, ensureCol_(s.sheet, s.headers, 'score')).setValue(r.absolute);
  SpreadsheetApp.getActiveSpreadsheet().toast('Row ' + s.row + ': ' + classifyNative_(p) + ', score ' + r.absolute);
}

// ----------------------------------------------------------------------------
// Render via the service (designed PDF + DOCX) → save to Drive
// ----------------------------------------------------------------------------
function menuRenderRow() { renderRows_([SpreadsheetApp.getActiveSheet().getActiveRange().getRow()]); }
function menuRenderAll() {
  var sh = SpreadsheetApp.getActiveSheet(), rows = [];
  for (var r = 2; r <= sh.getLastRow(); r++) rows.push(r);
  renderRows_(rows);
}

function renderRows_(rows) {
  var url = prop_('RENDER_URL');
  if (!url) throw new Error('Set RENDER_URL (deployed server/render-server.js) in Script properties.');
  var sh = SpreadsheetApp.getActiveSheet();
  var headers = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0];
  var jsonCol = headers.indexOf('profile_json') + 1;
  if (!jsonCol) throw new Error('No "profile_json" column.');
  var folder = prop_('DRIVE_FOLDER_ID') ? DriveApp.getFolderById(prop_('DRIVE_FOLDER_ID')) : DriveApp.getRootFolder();

  rows.forEach(function (row) {
    var raw = sh.getRange(row, jsonCol).getValue();
    if (!raw) return;
    var profile = JSON.parse(raw);
    var headers2 = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0];
    var opts = { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ profile: profile, formats: ['pdf', 'docx', 'odt'] }) };
    if (prop_('RENDER_TOKEN')) opts.headers = { Authorization: 'Bearer ' + prop_('RENDER_TOKEN') };
    var res = UrlFetchApp.fetch(url, opts);
    var out = JSON.parse(res.getContentText());
    var name = (profile.identity && profile.identity.name || 'resume').replace(/\s+/g, '_');
    if (out.pdf_base64) sh.getRange(row, ensureCol_(sh, headers2, 'pdf_url')).setValue(saveB64_(folder, out.pdf_base64, 'application/pdf', name + '.pdf'));
    if (out.docx_base64) sh.getRange(row, ensureCol_(sh, headers2, 'docx_url')).setValue(saveB64_(folder, out.docx_base64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name + '.docx'));
    if (out.odt_base64) sh.getRange(row, ensureCol_(sh, headers2, 'odt_url')).setValue(saveB64_(folder, out.odt_base64, 'application/vnd.oasis.opendocument.text', name + '.odt'));
    if (out.council) sh.getRange(row, ensureCol_(sh, headers2, 'score')).setValue(out.council.absolute);
  });
  SpreadsheetApp.getActiveSpreadsheet().toast('Rendered ' + rows.length + ' row(s).');
}

function saveB64_(folder, b64, mime, name) {
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), mime, name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

// ----------------------------------------------------------------------------
// Native ODT export (no service) — demonstrates Utilities.zip
// ----------------------------------------------------------------------------
function menuOdtNative() {
  var s = activeRowCol_('profile_json');
  var p = JSON.parse(s.sheet.getRange(s.row, s.col).getValue());
  var folder = prop_('DRIVE_FOLDER_ID') ? DriveApp.getFolderById(prop_('DRIVE_FOLDER_ID')) : DriveApp.getRootFolder();
  var blob = buildOdtNative_(p);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  s.sheet.getRange(s.row, ensureCol_(s.sheet, s.headers, 'odt_url')).setValue(file.getUrl());
  SpreadsheetApp.getActiveSpreadsheet().toast('Native ODT saved for row ' + s.row);
}

function xml_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/** Compact native ODT (an ODT is a zip of XML). Full styling lives in the Node exporter. */
function buildOdtNative_(p) {
  var id = p.identity || {};
  var body = [];
  body.push('<text:p text:style-name="Name">' + xml_(id.name) + '</text:p>');
  if (id.headline) body.push('<text:p text:style-name="Title">' + xml_(id.headline) + '</text:p>');
  var contact = ['location', 'email', 'phone', 'linkedin', 'website'].map(function (k) { return id[k]; }).filter(Boolean).join('  |  ');
  if (contact) body.push('<text:p>' + xml_(contact) + '</text:p>');

  function section(title, items, isBullets) {
    if (!items || !items.length) return;
    body.push('<text:h text:outline-level="1">' + xml_(title) + '</text:h>');
    if (isBullets) { body.push('<text:list>'); items.forEach(function (t) { body.push('<text:list-item><text:p>' + xml_(t) + '</text:p></text:list-item>'); }); body.push('</text:list>'); }
    else items.forEach(function (t) { body.push('<text:p>' + xml_(t) + '</text:p>'); });
  }
  if (p.summary && (p.summary.long || p.summary.short)) section('Summary', [p.summary.long || p.summary.short]);
  (p.current_roles || []).forEach(function (r) {
    body.push('<text:h text:outline-level="2">' + xml_((r.title || '') + ' — ' + (r.company || '') + (r.dates ? ' (' + r.dates + ')' : '')) + '</text:h>');
    section('', r.highlights || [], true);
  });
  section('Achievements', p.achievements || [], true);
  var skills = p.core_competencies ? [].concat.apply([], Object.keys(p.core_competencies).map(function (k) { return p.core_competencies[k]; })) : [];
  if (skills.length) section('Skills', [skills.join('  ·  ')]);
  (p.education || []).forEach(function (e) { section('Education', [(e.degree || '') + (e.field ? ', ' + e.field : '') + (e.institution ? ' — ' + e.institution : '')]); });
  section('Awards', (p.awards || []).map(function (a) { return typeof a === 'string' ? a : a.name; }), true);
  if ((p.languages || []).length) section('Languages', [p.languages.join('  ·  ')]);

  var NS = 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"';
  var content = '<?xml version="1.0" encoding="UTF-8"?>\n<office:document-content ' + NS + ' office:version="1.2">' +
    '<office:automatic-styles>' +
    '<style:style style:name="Name" style:family="paragraph"><style:text-properties fo:font-weight="bold" fo:font-size="20pt"/></style:style>' +
    '<style:style style:name="Title" style:family="paragraph"><style:text-properties fo:font-size="11pt" fo:font-weight="bold"/></style:style>' +
    '</office:automatic-styles>' +
    '<office:body><office:text>' + body.join('\n') + '</office:text></office:body></office:document-content>';
  var manifest = '<?xml version="1.0" encoding="UTF-8"?>\n<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">' +
    '<manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>' +
    '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' +
    '</manifest:manifest>';

  var blobs = [
    Utilities.newBlob('application/vnd.oasis.opendocument.text', 'text/plain', 'mimetype'),
    Utilities.newBlob(content, 'text/xml', 'content.xml'),
    Utilities.newBlob(manifest, 'text/xml', 'META-INF/manifest.xml')
  ];
  var zipped = Utilities.zip(blobs, (id.name || 'resume').replace(/\s+/g, '_') + '.odt');
  return zipped.setContentType('application/vnd.oasis.opendocument.text');
}
