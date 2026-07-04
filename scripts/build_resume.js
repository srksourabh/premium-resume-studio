#!/usr/bin/env node
// Premium Resume Studio — orchestrator.
//
// Pipeline:  load profile → CLASSIFY archetype → pick theme → RENDER (HTML+CSS)
//            → print to A4 PDF via Chromium → convene the MODEL COUNCIL → report.
//
// The council prints an absolute score and ranked fixes. Re-run after applying
// fixes to the profile; the loop terminates when the score clears --threshold.
//
// Usage:
//   node scripts/build_resume.js --profile profile/sourabh.json --out output.pdf
//   node scripts/build_resume.js --profile p.json --theme royal-emerald --html --ats
//   node scripts/build_resume.js --list-themes | --list-templates
//   node scripts/build_resume.js --profile p.json --score-only     (no render)

'use strict';

const fs = require('fs');
const path = require('path');

const { classify } = require('./lib/classify');
const { getTheme, THEMES, themeForArchetype } = require('./lib/themes');
const { getTemplate, getRenderer, listTemplates, atsText } = require('./lib/templates');
const { selectDesign, listDesigns } = require('./lib/design/select');
const council = require('./lib/council');
const { deriveMetrics } = require('./lib/helpers');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
}
const flag = (name) => process.argv.includes(name);

function die(msg, code = 1) { console.error(msg); process.exit(code); }

// ---- info commands ----
if (flag('--list-themes')) {
  console.log('\nThemes:');
  for (const [k, t] of Object.entries(THEMES)) console.log(`  ${k.padEnd(16)} ${t.label}`);
  process.exit(0);
}
if (flag('--list-templates')) {
  console.log('\nTemplates:');
  for (const t of listTemplates()) console.log(`  ${t.id.padEnd(12)} ${t.label}`);
  process.exit(0);
}
if (flag('--list-designs')) {
  const ds = listDesigns();
  console.log(`\n${ds.length} design models (id · name · family · palette · type):`);
  for (const d of ds) console.log(`  ${String(d.n).padStart(3)}  ${d.id.padEnd(34)} ${d.name.padEnd(22)} ${d.family.padEnd(14)} ${d.palette.padEnd(15)} ${d.type}`);
  process.exit(0);
}

const PROFILE = arg('--profile', path.join(__dirname, '..', 'profile', 'sourabh.json'));
const OUT_PDF = arg('--out', 'output.pdf');
const THRESHOLD = Number(arg('--threshold', '85'));
const ALSO_HTML = flag('--html');
const ALL = flag('--all');
const FORMATS = (arg('--format', '') || '').toLowerCase();
const ALSO_ATS = flag('--ats') || ALL || FORMATS.includes('ats') || FORMATS.includes('txt');
const ALSO_DOCX = flag('--docx') || ALL || FORMATS.includes('docx');
const ALSO_ODT = flag('--odt') || ALL || FORMATS.includes('odt');
const COVER = flag('--cover') || ALL;
const SCORE_ONLY = flag('--score-only');
const AS_JSON = flag('--json');
const NO_FIT = flag('--no-fit');
const MAX_PAGES = arg('--max-pages', null) ? parseInt(arg('--max-pages', null), 10) : null;

if (!fs.existsSync(PROFILE)) die(`Profile not found: ${PROFILE}`);
const p = JSON.parse(fs.readFileSync(PROFILE, 'utf8'));
if (!p.identity || !p.identity.name) die('Profile missing required field: identity.name');

// ---- classify (or honor overrides) ----
const forcedArchetype = arg('--archetype', null);
const cls = classify(p, { theme: arg('--theme', null) });
if (forcedArchetype) { cls.archetype = forcedArchetype; cls.recommendedTheme = arg('--theme', themeForArchetype(forcedArchetype)); }
// ---- pick a design model from the 100+ catalog (best-fit, or overridden) ----
const selection = selectDesign(cls, p, {
  design: arg('--design', null),
  variant: arg('--variant', null) ? parseInt(arg('--variant', null), 10) : null,
  random: flag('--random'),
});
const chosen = selection.design;
// --theme forces the palette on top of the chosen design.
const themeKey = arg('--theme', chosen.theme);
const theme = getTheme(themeKey);
const design = { theme: themeKey, type: chosen.type, ornaments: chosen.ornaments, family: chosen.family };
// A catalog design is archetype-appropriate by construction, so it "fits".
const themeMatchesArchetype = (chosen.tags && chosen.tags.archetypes || []).includes(cls.archetype)
  || themeKey === themeForArchetype(cls.archetype);

function classificationBanner() {
  const L = [];
  L.push('');
  L.push('  ┌─── AUTO-CLASSIFICATION + DESIGN ──────────────────────────┐');
  L.push(`  │  Archetype : ${cls.archetype.padEnd(12)}  Seniority: ${String(cls.seniority).padEnd(10)}  │`);
  L.push(`  │  Fresher?  : ${String(cls.isFresher).padEnd(12)}  Confidence: ${String(cls.confidence).padEnd(8)}  │`);
  L.push(`  │  Design    : #${String(chosen.n).padEnd(3)} ${chosen.name.padEnd(38)}│`);
  L.push('  └───────────────────────────────────────────────────────────┘');
  L.push(`  Layout: ${chosen.family} · Palette: ${themeKey} · Type: ${chosen.type}`);
  L.push(`  Chosen: ${selection.reason}  (${selection.fitting} designs fit · ${selection.total} total)`);
  L.push('  More: --variant N · --design <id> · --random · --list-designs');
  return L.join('\n');
}

// ---- optional cover-letter draft ----
function coverLetter() {
  const id = p.identity || {};
  const m = deriveMetrics(p, 2).map((x) => `${x.value} ${x.label}`.trim()).join(' and ');
  const role = (id.headline || '').split('|')[0].trim();
  return `${id.name}
${[id.email, id.phone, id.linkedin].filter(Boolean).join('  |  ')}

Dear Hiring Committee,

I am writing to express my interest in the [ROLE] position at [COMPANY]. As ${role || 'a professional'}${m ? `, with a track record of ${m}` : ''}, I bring the leadership, execution, and outcomes your team is looking for.

${p.summary?.long || p.summary?.short || ''}

${(p.achievements || []).slice(0, 3).map((a) => `• ${a}`).join('\n')}

I would welcome the chance to discuss how I can contribute to [COMPANY]. Thank you for your consideration.

Sincerely,
${id.name}
`;
}

async function renderPdf(html, outAbs, { fit = true, maxPages = null } = {}) {
  const { launchChromium } = require('./lib/browser');
  const { fitPage, PAGE_PX } = require('./lib/fit');
  let browser;
  try { browser = await launchChromium(); }
  catch (e) { die('\n' + e.message + '\n', 2); }
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.emulateMedia({ media: 'print' });
    await page.setContent(html, { waitUntil: 'networkidle' });

    let pages, scale = '1';
    if (fit) {
      const r = await fitPage(page, { maxPages });
      pages = r.pages; scale = r.font !== 1 ? `densify ${r.font}` : `fill ${r.space}`;
    } else {
      const h = await page.evaluate(() => (document.querySelector('.sheet') || document.body).getBoundingClientRect().height);
      pages = Math.max(1, Math.round(h / PAGE_PX));
    }
    await page.pdf({
      path: outAbs, format: 'A4', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true,
    });
    return { pages, scale };
  } finally {
    await browser.close();
  }
}

(async () => {
  const outAbs = path.resolve(OUT_PDF);
  const tpl = getRenderer(chosen.renderer);
  const html = tpl.render(p, { theme, classification: cls, design });

  console.log(classificationBanner());

  let pages = null;
  if (!SCORE_ONLY) {
    if (ALSO_HTML) fs.writeFileSync(outAbs.replace(/\.pdf$/i, '.html'), html);
    const res = await renderPdf(html, outAbs, { fit: !NO_FIT, maxPages: MAX_PAGES });
    pages = res.pages;
    const kb = Math.round(fs.statSync(outAbs).size / 1024);
    console.log(`\n  ✅ PDF   : ${outAbs}  (${pages} page${pages > 1 ? 's' : ''}, ${kb} KB, design: ${chosen.name}, ${res.scale})`);
    if (ALSO_HTML) console.log(`  ✅ HTML  : ${outAbs.replace(/\.pdf$/i, '.html')}`);
  }

  let atsWritten = false;
  if (ALSO_ATS) {
    const txt = outAbs.replace(/\.pdf$/i, '.ats.txt');
    fs.writeFileSync(txt, atsText(p));
    atsWritten = true;
    console.log(`  ✅ ATS   : ${txt}  (plain-text, parser-safe)`);
  }
  if (ALSO_DOCX) {
    const { toDocxBuffer } = require('./lib/export/docx');
    const out = outAbs.replace(/\.pdf$/i, '.docx');
    fs.writeFileSync(out, await toDocxBuffer(p, { classification: cls, theme, themeKey }));
    console.log(`  ✅ DOCX  : ${out}  (editable Word, single-column)`);
  }
  if (ALSO_ODT) {
    const { toOdtBuffer } = require('./lib/export/odt');
    const out = outAbs.replace(/\.pdf$/i, '.odt');
    fs.writeFileSync(out, await toOdtBuffer(p, { classification: cls, theme, themeKey }));
    console.log(`  ✅ ODT   : ${out}  (OpenDocument, editable)`);
  }
  if (COVER) {
    const cov = outAbs.replace(/\.pdf$/i, '.cover.txt');
    fs.writeFileSync(cov, coverLetter());
    console.log(`  ✅ Cover : ${cov}  (draft — fill [ROLE]/[COMPANY])`);
  }

  // ---- Model Council ----
  const report = council.convene(p, {
    classification: cls,
    atsVariant: atsWritten,
    themeMatchesArchetype,
    pages,
  }, THRESHOLD);

  if (AS_JSON) {
    console.log(JSON.stringify({ classification: cls, theme: themeKey, pages, council: report }, null, 2));
  } else {
    console.log(council.formatReport(report));
    if (!report.passed) {
      console.log('  ⏳ Below threshold. Apply the top fixes to the profile JSON and re-run.');
      console.log('     (Resolve placeholders, quantify bullets, add metrics, strengthen verbs.)\n');
    } else {
      console.log('  ✅ Council approved — resume clears the quality bar.\n');
    }
  }

  process.exit(report.passed || SCORE_ONLY ? 0 : 3);
})().catch((e) => die('Error: ' + (e && e.stack || e)));
