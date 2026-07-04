#!/usr/bin/env node
// Regenerate the examples gallery: seven very different people, each in a
// distinct layout family + palette + typography, rendered to a PDF and a
// page-1 PNG preview. Run: node scripts/build_gallery.js
//
// The point of the gallery is to show the Studio produces genuinely different
// résumés — not one structure recolored — so every entry uses a different
// profile AND a different design family.

'use strict';

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const { classify } = require('./lib/classify');
const { getTheme } = require('./lib/themes');
const { getRenderer } = require('./lib/templates');
const { selectDesign } = require('./lib/design/select');
const { fitPage } = require('./lib/fit');
const { launchChromium } = require('./lib/browser');
const council = require('./lib/council');

const PAGE_PX = 1122.5;
const OUT = path.join(REPO, 'examples', 'gallery');

// slug · profile · forced design · one-line "who this is"
const ENTRIES = [
  ['01-executive-graphite', 'profile/sourabh.json', 'executive-graphite-azure-sans', 'Founder / CEO — IT & AI'],
  ['02-cfo-midnight-gold', 'examples/cfo-sample.json', 'executive-midnight-gold-serif-head', 'CFO — SaaS finance'],
  ['03-creative-plum-banner', 'examples/creative-sample.json', 'header-band-plum-coral-display', 'Creative Director — brand'],
  ['04-engineer-steel-sidebar', 'examples/engineer-sample.json', 'sidebar-right-steel-cyan-mono-accent', 'Senior Software Engineer'],
  ['05-physician-forest-single', 'examples/physician-sample.json', 'single-forest-copper-serif-head', 'Consultant Cardiologist'],
  ['06-fresher-teal-spark', 'examples/fresher-sample.json', 'fresher-teal-sunrise-sans', 'New-grad Software Engineer'],
  ['07-academic-navy-scholar', 'examples/academic-sample.json', 'academic-academic-navy-serif-head', 'Assistant Professor — CS'],
];

async function renderOne(browser, entry) {
  const [slug, profileRel, designId, who] = entry;
  const p = JSON.parse(fs.readFileSync(path.join(REPO, profileRel), 'utf8'));
  const cls = classify(p);
  const sel = selectDesign(cls, p, { design: designId });
  const d = sel.design;
  const design = { theme: d.theme, type: d.type, ornaments: d.ornaments, family: d.family };
  const html = getRenderer(d.renderer).render(p, { theme: getTheme(d.theme), classification: cls, design });

  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.5 });
  await page.emulateMedia({ media: 'print' });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const fit = await fitPage(page, {});
  const H = await page.evaluate(() => (document.querySelector('.sheet') || document.body).getBoundingClientRect().height);
  const pages = Math.max(1, Math.ceil((H - 6) / PAGE_PX));

  await page.pdf({
    path: path.join(OUT, `${slug}.pdf`), format: 'A4', printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true,
  });
  // Page-1 preview PNG. Grow viewport so the clip is within bounds.
  await page.setViewportSize({ width: 794, height: Math.min(16000, Math.ceil(H) + 4) });
  await page.screenshot({
    path: path.join(OUT, `${slug}.png`),
    clip: { x: 0, y: 0, width: 794, height: Math.min(PAGE_PX, H) },
  });
  await page.close();

  const report = council.convene(p, { classification: cls, atsVariant: true, themeMatchesArchetype: true, pages }, 85);
  return { slug, who, design: d, pages, absolute: report.absolute, passed: report.passed };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // Clear stale gallery files so removed designs don't linger.
  for (const f of fs.readdirSync(OUT)) if (/\.(png|pdf)$/i.test(f)) fs.unlinkSync(path.join(OUT, f));

  const browser = await launchChromium();
  const rows = [];
  try {
    for (const e of ENTRIES) {
      const r = await renderOne(browser, e);
      rows.push(r);
      console.log(`  ${r.slug.padEnd(28)} #${String(r.design.n).padStart(3)} ${r.design.name.padEnd(24)} ${r.design.family.padEnd(14)} ${r.pages}p  council ${r.absolute} ${r.passed ? 'PASS' : 'FAIL'}`);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(rows.map((r) => ({
    slug: r.slug, who: r.who, design: r.design.id, name: r.design.name,
    family: r.design.family, palette: r.design.theme, type: r.design.type,
    pages: r.pages, council: r.absolute,
  })), null, 2));
  console.log(`\n  ✅ Gallery written to ${OUT} (${rows.length} designs)`);
})().catch((e) => { console.error('gallery error:', e && e.stack || e); process.exit(1); });
