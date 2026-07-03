// Build a stunning HTML → PDF resume using Playwright + Chromium.
// Reads a JSON profile, renders a two-column dark-sidebar design, outputs A4 PDF.
//
// Requires Playwright. Run ./install.sh first if you haven't.

const fs = require('fs');
const path = require('path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  // Helpful error if Playwright isn't installed.
  console.error('\nplaywright module not found.');
  console.error('Run  ./install.sh  once to install it (also installs Chromium).\n');
  process.exit(2);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PROFILE = arg('--profile', path.join(__dirname, '..', 'profile', 'sourabh.json'));
const OUT_PDF = arg('--out', 'output.pdf');
const ALSO_HTML = process.argv.includes('--html');

if (!fs.existsSync(PROFILE)) {
  console.error(`Profile not found: ${PROFILE}`);
  process.exit(1);
}
const p = JSON.parse(fs.readFileSync(PROFILE, 'utf8'));

if (!p.identity || !p.identity.name) {
  console.error('Profile missing required field: identity.name');
  process.exit(1);
}

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const initials = (() => {
  const parts = (p.identity.name || '').split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
})();

const skillPills = (group, max = 6) => {
  const arr = p.core_competencies?.[group] || [];
  return arr.slice(0, max).map(s => `<span class="pill">${esc(s)}</span>`).join('');
};

const ventureBlock = (r) => `
  <article class="venture">
    <header>
      <h3>${esc(r.company)}</h3>
      <span class="role">${esc(r.title)}</span>
    </header>
    ${r.highlights?.length ? `<ul>${r.highlights.slice(0, 3).map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
  </article>`.trim();

const productBlock = (pr) => `
  <article class="product">
    <h4>${esc(pr.name)}</h4>
    <p class="product-type">${esc(pr.type)}</p>
    <p>${(pr.scope || []).slice(0, 4).map(esc).join(' · ')}</p>
  </article>`.trim();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(p.identity.name)} — Resume</title>
<style>
  *,*::before,*::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #1c2434;
    background: #fff;
    -webkit-font-smoothing: antialiased;
    font-size: 10pt;
    line-height: 1.45;
  }

  @page { size: A4; margin: 0; }
  .page {
    width: 210mm;
    min-height: 297mm;
    display: grid;
    grid-template-columns: 70mm 1fr;
  }

  aside {
    background: linear-gradient(165deg, #0c1f3a 0%, #14365f 60%, #1f4f8a 100%);
    color: #f1f4fa;
    padding: 14mm 10mm 14mm 12mm;
    position: relative;
  }
  aside::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 8px 8px;
    pointer-events: none;
  }
  .monogram {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f4b860 0%, #d68b3c 100%);
    color: #0c1f3a;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 22pt; letter-spacing: 1px;
    margin-bottom: 7mm;
    box-shadow: 0 4px 18px rgba(244,184,96,0.35);
  }
  .side-name { font-size: 17pt; font-weight: 800; line-height: 1.15; margin: 0 0 1mm 0; letter-spacing: -0.2px; }
  .side-title { font-size: 9pt; font-weight: 500; color: #c4d3ea; margin-bottom: 8mm; line-height: 1.35; }
  .side-section { margin-bottom: 6mm; position: relative; z-index: 1; }
  .side-section h2 {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 1.6px;
    color: #f4b860;
    margin: 0 0 3mm 0;
    font-weight: 700;
    border-bottom: 1px solid rgba(244,184,96,0.4);
    padding-bottom: 1.5mm;
  }
  .side-section .line { font-size: 9pt; margin-bottom: 1.4mm; color: #e6ecf5; }
  .side-section .line strong { color: #fff; }
  .pills { display: flex; flex-wrap: wrap; gap: 1.4mm; }
  .pill {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.18);
    color: #e6ecf5;
    padding: 1.2mm 3mm;
    border-radius: 14px;
    font-size: 7.8pt;
    line-height: 1.2;
    white-space: nowrap;
  }
  .open-to {
    background: linear-gradient(135deg, rgba(244,184,96,0.18) 0%, rgba(244,184,96,0.06) 100%);
    border-radius: 4px;
    padding: 4mm 4mm 3mm 4mm !important;
    border: 1px solid rgba(244,184,96,0.35);
  }
  .open-to h2 { color: #f4b860 !important; border-bottom-color: rgba(244,184,96,0.6) !important; }
  .milestone { display: flex; gap: 3mm; align-items: baseline; margin-bottom: 2mm; font-size: 8.5pt; color: #e6ecf5; }
  .milestone .m-year { color: #f4b860; font-weight: 700; min-width: 10mm; flex-shrink: 0; }
  .milestone .m-evt { line-height: 1.35; }

  main { padding: 14mm 12mm 14mm 10mm; background: #fff; }
  .top-strip { border-bottom: 2px solid #0c1f3a; padding-bottom: 4mm; margin-bottom: 6mm; }
  .top-strip h1 { font-size: 30pt; line-height: 1.05; margin: 0; color: #0c1f3a; font-weight: 800; letter-spacing: -0.8px; }

  .lede {
    font-size: 10.5pt; line-height: 1.55; color: #2a3344;
    background: linear-gradient(90deg, rgba(244,184,96,0.10) 0%, rgba(244,184,96,0) 100%);
    border-left: 3px solid #f4b860;
    padding: 4mm 5mm; margin-bottom: 4mm;
    border-radius: 0 4px 4px 0;
  }
  .metrics-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-bottom: 6mm; }
  .metric { background: #f5f7fb; border-radius: 4px; padding: 3mm 4mm; border-bottom: 2px solid #d68b3c; }
  .m-num { font-size: 14pt; font-weight: 800; color: #0c1f3a; line-height: 1; margin-bottom: 1mm; }
  .m-lab { font-size: 7.5pt; color: #5b6478; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }

  section.block { margin-bottom: 6mm; page-break-inside: avoid; }
  section.block h2 { font-size: 11pt; color: #0c1f3a; text-transform: uppercase; letter-spacing: 1.4px; margin: 0 0 3.5mm 0; padding-bottom: 1.5mm; border-bottom: 1px solid #e0e6f0; font-weight: 800; }
  section.block h2 .accent { color: #d68b3c; }

  .ventures { display: flex; flex-direction: column; gap: 4mm; }
  .venture { position: relative; padding-left: 6mm; border-left: 2px solid #e0e6f0; }
  .venture::before { content: ''; position: absolute; left: -3.6mm; top: 1.2mm; width: 5mm; height: 5mm; border-radius: 50%; background: #fff; border: 2px solid #0c1f3a; }
  .venture header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2mm; margin-bottom: 1.5mm; }
  .venture h3 { font-size: 11.5pt; margin: 0; color: #0c1f3a; font-weight: 800; }
  .venture .role { font-size: 9pt; color: #d68b3c; font-weight: 600; }
  .venture ul { margin: 0; padding-left: 5mm; font-size: 9.4pt; color: #2a3344; }
  .venture li { margin-bottom: 1mm; }

  .products { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .product { background: #f5f7fb; border-radius: 6px; padding: 4mm 5mm; border-top: 3px solid #d68b3c; }
  .product h4 { margin: 0 0 0.8mm 0; color: #0c1f3a; font-size: 11pt; font-weight: 800; }
  .product-type { margin: 0 0 2mm 0; font-size: 8pt; color: #d68b3c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
  .product p { margin: 0; font-size: 8.5pt; color: #2a3344; line-height: 1.5; }

  .ach-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm 6mm; }
  .ach-list li { position: relative; padding-left: 5mm; font-size: 9.2pt; color: #2a3344; }
  .ach-list li::before { content: '▸'; color: #d68b3c; position: absolute; left: 0; top: 0; font-weight: 800; }

  .bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 2mm; }
  .bottom-row h2 { font-size: 9.5pt; }
  .bottom-row .item { font-size: 9pt; margin-bottom: 1.5mm; color: #2a3344; }
  .bottom-row .item strong { color: #0c1f3a; }

  footer { display: none; }
</style>
</head>
<body>
<div class="page">
  <aside>
    <div class="monogram">${initials}</div>
    <div class="side-name">${esc(p.identity.name)}</div>
    <div class="side-title">${esc(p.identity.headline)}</div>

    <div class="side-section">
      <h2>Contact</h2>
      <div class="line">${esc(p.identity.location || '')}</div>
      <div class="line">${esc(p.identity.email || '')}</div>
      <div class="line">${esc(p.identity.phone || '')}</div>
      ${p.identity.linkedin ? `<div class="line">${esc(p.identity.linkedin)}</div>` : ''}
    </div>

    ${p.core_competencies ? `
    <div class="side-section">
      <h2>Specialties</h2>
      <div class="pills">${skillPills('business_leadership', 5)}</div>
    </div>
    <div class="side-section">
      <h2>Operations</h2>
      <div class="pills">${skillPills('operations_management', 5)}</div>
    </div>
    <div class="side-section">
      <h2>Tech &amp; AI</h2>
      <div class="pills">${skillPills('technology_and_ai', 6)}</div>
    </div>` : ''}

    ${(p.education || []).length ? `
    <div class="side-section">
      <h2>Education</h2>
      ${p.education.map(e => `<div class="line"><strong>${esc(e.degree || '')}</strong>${e.field ? ` — ${esc(e.field)}` : ''}</div>`).join('')}
    </div>` : ''}

    ${(p.certifications || []).length ? `
    <div class="side-section">
      <h2>Certifications</h2>
      ${p.certifications.map(c => `<div class="line"><strong>${esc(c.name || '')}</strong>${c.year ? ` (${esc(String(c.year))})` : ''}${c.score ? ` — ${esc(c.score)}` : ''}</div>`).join('')}
    </div>` : ''}

    ${(p.memberships || []).length ? `
    <div class="side-section">
      <h2>Memberships</h2>
      ${p.memberships.map(m => `<div class="line">${esc(m)}</div>`).join('')}
    </div>` : ''}

    ${(p.achievements || []).length ? `
    <div class="side-section">
      <h2>Milestones</h2>
      <div class="milestone"><span class="m-year">2008</span><span class="m-evt">SAP ABAP — 84% (top tier)</span></div>
      <div class="milestone"><span class="m-year">—</span><span class="m-evt">UDS founded; cross ₹10 Cr</span></div>
      <div class="milestone"><span class="m-year">—</span><span class="m-evt">Top 50 Emerging Startup (India)</span></div>
      <div class="milestone"><span class="m-year">2023</span><span class="m-evt">Annapurna Base Camp summit</span></div>
    </div>` : ''}

    <div class="side-section">
      <h2>Languages</h2>
      <div class="line">English · Hindi · Bengali</div>
    </div>

    <div class="side-section open-to">
      <h2>Open To</h2>
      <div class="line" style="font-size:8.8pt; line-height:1.5; color:#fde4be;">AI-led field-ops advisory · board &amp; co-founder conversations · strategic partnerships</div>
    </div>
  </aside>

  <main>
    <div class="top-strip">
      <h1>${esc(p.identity.name)}</h1>
    </div>

    <div class="lede">${esc(p.summary?.long || p.summary?.short || '')}</div>

    <div class="metrics-strip">
      <div class="metric"><div class="m-num">₹10Cr</div><div class="m-lab">Revenue milestone</div></div>
      <div class="metric"><div class="m-num">${esc(p.current_roles?.length || 0)}</div><div class="m-lab">Ventures led</div></div>
      <div class="metric"><div class="m-num">Pan-India</div><div class="m-lab">Service delivery</div></div>
      <div class="metric"><div class="m-num">84%</div><div class="m-lab">SAP ABAP — top tier 2008</div></div>
    </div>

    ${(p.current_roles || []).length ? `
    <section class="block">
      <h2>Ventures <span class="accent">//</span> Leadership</h2>
      <div class="ventures">
        ${p.current_roles.map(ventureBlock).join('\n')}
      </div>
    </section>` : ''}

    ${(p.products_conceptualised || []).length ? `
    <section class="block">
      <h2>Products <span class="accent">//</span> Concepts</h2>
      <div class="products">
        ${p.products_conceptualised.map(productBlock).join('\n')}
      </div>
    </section>` : ''}

    ${(p.achievements || []).length ? `
    <section class="block">
      <h2>Notable Achievements</h2>
      <ul class="ach-list">
        ${p.achievements.slice(0, 8).map(a => `<li>${esc(a)}</li>`).join('')}
      </ul>
    </section>` : ''}

    <div class="bottom-row">
      ${(p.awards || []).length ? `
      <section class="block">
        <h2>Awards</h2>
        ${p.awards.map(a => `<div class="item">${esc(a)}</div>`).join('')}
      </section>` : ''}
      ${(p.interests || []).length ? `
      <section class="block">
        <h2>Beyond Work</h2>
        <div class="item">${esc(p.interests.slice(0, 5).join(' · '))}</div>
        <div class="item" style="font-size:8pt; color:#5b6478; margin-top:3mm;">Annapurna Base Camp summit — Oct 2023</div>
      </section>` : ''}
    </div>
  </main>
</div>
</body>
</html>`;

const outAbs = path.resolve(OUT_PDF);
const htmlPath = ALSO_HTML ? outAbs.replace(/\.pdf$/, '.html') : path.join(__dirname, '..', 'examples', '_preview.html');
fs.writeFileSync(htmlPath, html);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.pdf({
    path: outAbs,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });
  await browser.close();
  console.log(`OK: ${outAbs}`);
  if (ALSO_HTML) console.log(`OK: ${htmlPath}`);
})();
