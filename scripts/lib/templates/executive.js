// Executive / corporate template — CEO-grade, two-column, board-ready.
// Deep sidebar, data-driven metric strip, timeline of ventures, product cards.

'use strict';

const { esc, initials, deriveMetrics, first } = require('../helpers');
const { icon, pills, docShell, contactBlock } = require('./_components');

const css = `
  .sheet{ display:grid; grid-template-columns:68mm 1fr; }
  .aside{ padding:11mm 8mm 11mm 10mm; }
  .name{ font-size:17pt; font-weight:800; line-height:1.12; margin:5mm 0 1mm; letter-spacing:-.3px; }
  .head{ font-size:8.6pt; font-weight:500; color:var(--side-muted); line-height:1.38; margin-bottom:5mm; }
  main{ padding:11mm 12mm 11mm 10mm; }
  .banner{ border-bottom:2.5px solid var(--side-from); padding-bottom:3mm; margin-bottom:3.6mm; display:flex; align-items:flex-end; justify-content:space-between; gap:6mm; }
  .banner h1{ font-size:27pt; line-height:1; color:var(--ink); font-weight:800; letter-spacing:-.8px; }
  .banner .role{ font-size:8.8pt; color:var(--accent-deep); font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-top:1.8mm; }
  .banner .tag{ text-align:right; font-size:7.8pt; color:var(--ink-soft); line-height:1.38; max-width:46mm; }
  .lede{ margin-bottom:4mm; }
  .metrics{ margin-bottom:4.5mm; }
  .block{ margin-bottom:4.2mm; }
  .ventures{ display:flex; flex-direction:column; gap:2.8mm; }
  .venture{ position:relative; padding-left:6mm; border-left:2px solid var(--hairline); }
  .venture::before{ content:''; position:absolute; left:-3.4mm; top:1mm; width:4.6mm; height:4.6mm; border-radius:50%; background:var(--bg); border:2.4px solid var(--side-from); }
  .venture.lead::before{ background:var(--accent); border-color:var(--accent-deep); }
  .v-head{ display:flex; flex-wrap:wrap; align-items:baseline; gap:2mm 3mm; margin-bottom:1mm; }
  .v-head h3{ font-size:11.5pt; color:var(--ink); font-weight:800; }
  .v-head .r{ font-size:9pt; color:var(--accent-deep); font-weight:700; }
  .v-head .d{ font-size:8pt; color:var(--ink-soft); margin-left:auto; white-space:nowrap; }
  .v-meta{ font-size:7.8pt; color:var(--ink-soft); margin-bottom:1.5mm; }
  .venture ul{ padding-left:4.5mm; font-size:9.2pt; color:var(--ink); }
  .venture li{ margin-bottom:.8mm; }
  .products{ display:grid; grid-template-columns:1fr 1fr; gap:3.5mm; }
  .product{ background:var(--surface); border-radius:7px; padding:3.5mm 4mm; border-top:3px solid var(--accent-deep); }
  .product h4{ color:var(--ink); font-size:10.5pt; font-weight:800; margin-bottom:.6mm; }
  .product .t{ font-size:7.6pt; color:var(--accent-deep); font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:1.6mm; }
  .product p{ font-size:8.4pt; color:var(--ink); line-height:1.45; }
  .ach{ list-style:none; padding:0; display:grid; grid-template-columns:1fr 1fr; gap:1.2mm 6mm; }
  .ach li{ position:relative; padding-left:5mm; font-size:9pt; color:var(--ink); }
  .ach li::before{ content:''; position:absolute; left:0; top:1.6mm; width:2.4mm; height:2.4mm; border-radius:50%; background:var(--accent); }
  .earlier{ display:flex; flex-direction:column; gap:1mm; }
  .early{ display:flex; align-items:baseline; gap:3mm; font-size:9pt; padding:1mm 0; border-bottom:1px dotted var(--hairline); }
  .early .ec{ font-weight:700; color:var(--ink); min-width:52mm; }
  .early .et{ color:var(--ink-soft); }
  .early .ed{ margin-left:auto; font-size:8pt; color:var(--ink-soft); }
  .brow{ display:grid; grid-template-columns:1fr 1fr; gap:6mm; }
  .brow .item{ font-size:8.7pt; margin-bottom:1.2mm; color:var(--ink); }
  .open-to{ background:linear-gradient(135deg,rgba(var(--accent-rgb),0.2),rgba(var(--accent-rgb),0.05)); border:1px solid rgba(var(--accent-rgb),0.4); border-radius:6px; padding:3.5mm 4mm; }
  .open-to .side-h{ border-bottom-color:rgba(var(--accent-rgb),0.55); }
  .open-to .txt{ font-size:8.6pt; line-height:1.5; color:var(--hero-ink); }
`;

function venture(r, i) {
  const dates = first(r.dates, [r.start, r.end].filter(Boolean).join(' – '), r.end);
  const meta = [r.location, r.industry].filter(Boolean).join('  ·  ');
  const hl = (r.highlights || []).slice(0, i === 0 ? 4 : 3);
  return `
  <article class="venture${i === 0 ? ' lead' : ''}">
    <div class="v-head">
      <h3>${esc(r.company)}</h3>
      <span class="r">${esc(r.title)}</span>
      ${dates ? `<span class="d">${esc(dates)}</span>` : ''}
    </div>
    ${meta ? `<div class="v-meta">${esc(meta)}</div>` : ''}
    ${hl.length ? `<ul>${hl.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
  </article>`;
}

function product(pr) {
  return `<article class="product"><h4>${esc(pr.name)}</h4><div class="t">${esc(pr.type || '')}</div><p>${esc((pr.scope || []).slice(0, 4).join(' · '))}</p></article>`;
}

function competencyGroups(cc) {
  const labels = {
    business_leadership: 'Leadership', operations_management: 'Operations',
    technology_and_ai: 'Technology & AI', product_and_innovation: 'Product',
    sales_and_marketing: 'Growth', creative_and_cultural: 'Creative',
  };
  return Object.entries(cc)
    .slice(0, 4)
    .map(([k, v]) => `<div class="side-sec"><h2 class="side-h">${esc(labels[k] || k.replace(/_/g, ' '))}</h2>${pills(v, 6)}</div>`)
    .join('');
}

function render(p, ctx = {}) {
  const id = p.identity || {};
  const metrics = deriveMetrics(p, 4);
  const summary = first(p.summary?.long, p.summary?.short, p.personal_brand_statement, '');
  const tag = first(p.career_objective && `“${p.career_objective}”`, '');

  const body = `
<div class="sheet">
  <aside class="aside">
    <div class="monogram">${initials(id.name)}</div>
    <div class="name">${esc(id.name)}</div>
    <div class="head">${esc(id.headline || '')}</div>

    <div class="side-sec">
      <h2 class="side-h">${icon('link')} Contact</h2>
      ${contactBlock(id)}
    </div>

    ${p.core_competencies ? competencyGroups(p.core_competencies) : ''}

    ${(p.education || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('cap')} Education</h2>
      ${p.education.map((e) => `<div class="side-line"><strong>${esc(e.degree || '')}</strong>${e.field ? ` — ${esc(e.field)}` : ''}${e.institution ? `<br><span class="muted" style="color:var(--side-muted)">${esc(e.institution)}${e.year ? `, ${esc(String(e.year))}` : ''}</span>` : ''}</div>`).join('')}</div>` : ''}

    ${(p.certifications || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('award')} Certifications</h2>
      ${p.certifications.map((c) => `<div class="side-line"><strong>${esc(c.name || '')}</strong>${c.year ? ` (${esc(String(c.year))})` : ''}${c.score ? ` — ${esc(c.score)}` : ''}</div>`).join('')}</div>` : ''}

    ${(p.memberships || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('star')} Memberships</h2>
      ${p.memberships.map((m) => `<div class="side-line">${esc(m)}</div>`).join('')}</div>` : ''}

    ${(p.languages || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('globe')} Languages</h2>
      <div class="side-line">${esc(p.languages.join(' · '))}</div></div>` : ''}

    ${(p.open_to || []).length ? `<div class="side-sec open-to"><h2 class="side-h">${icon('spark')} Open To</h2>
      <div class="txt">${esc(p.open_to.join(' · '))}</div></div>` : ''}
  </aside>

  <main>
    <div class="banner">
      <div>
        <h1>${esc(id.name)}</h1>
        <div class="role">${esc((id.headline || '').split('|')[0].trim())}</div>
      </div>
      ${tag ? `<div class="tag">${esc(tag)}</div>` : ''}
    </div>

    ${summary ? `<div class="lede">${esc(summary)}</div>` : ''}

    ${metrics.length ? `<div class="metrics" style="--mcols:${metrics.length}">
      ${metrics.map((m) => `<div class="metric"><div class="n">${esc(m.value)}</div><div class="l">${esc(m.label)}</div></div>`).join('')}
    </div>` : ''}

    ${(p.current_roles || []).length ? `<section class="block">
      <h2 class="sec-title">${icon('briefcase')} Ventures <span class="tick">//</span> Leadership</h2>
      <div class="ventures">${p.current_roles.map(venture).join('')}</div>
    </section>` : ''}

    ${(p.products_conceptualised || []).length ? `<section class="block">
      <h2 class="sec-title">${icon('cube')} Products <span class="tick">//</span> Concepts</h2>
      <div class="products">${p.products_conceptualised.map(product).join('')}</div>
    </section>` : ''}

    ${(p.achievements || []).length ? `<section class="block">
      <h2 class="sec-title">${icon('spark')} Notable Achievements</h2>
      <ul class="ach">${p.achievements.slice(0, 8).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
    </section>` : ''}

    ${(p.past_roles || []).length ? `<section class="block">
      <h2 class="sec-title">${icon('briefcase')} Earlier Career</h2>
      <div class="earlier">${p.past_roles.map((r) => `<div class="early"><span class="ec">${esc(r.company)}</span><span class="et">${esc(r.title)}</span>${r.dates ? `<span class="ed">${esc(r.dates)}</span>` : ''}</div>`).join('')}</div>
    </section>` : ''}

    <div class="brow">
      ${(p.awards || []).length ? `<section class="block"><h2 class="sec-title">${icon('award')} Awards</h2>
        ${p.awards.slice(0, 5).map((a) => `<div class="item">${esc(a)}</div>`).join('')}</section>` : ''}
      ${(p.interests || []).length ? `<section class="block"><h2 class="sec-title">${icon('heart')} Beyond Work</h2>
        <div class="item">${esc(p.interests.slice(0, 6).join(' · '))}</div></section>` : ''}
    </div>
  </main>
</div>`;

  return docShell({ title: `${id.name} — Resume`, css, body, design: ctx.design || { theme: ctx.theme } });
}

module.exports = { render, id: 'executive', label: 'Executive / Corporate' };
