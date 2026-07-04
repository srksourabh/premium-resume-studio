// Universal professional template — one renderer, several structural layouts,
// selected by ctx.design.family:
//   sidebar-right · single · header-band
// (the classic left-sidebar layout lives in executive.js). All are design-spec
// aware, so palette + typography + ornaments vary through them automatically.

'use strict';

const { esc, initials, first, deriveMetrics } = require('../helpers');
const { icon, pills, docShell, contactBlock } = require('./_components');

// ---------- shared section builders (main column) ----------
function lede(p) {
  const s = first(p.summary?.long, p.summary?.short, p.personal_brand_statement, '');
  return s ? `<div class="lede">${esc(s)}</div>` : '';
}
function metricStrip(p, max = 4) {
  const m = deriveMetrics(p, max);
  return m.length ? `<div class="metrics" style="--mcols:${m.length}">${m.map((x) => `<div class="metric"><div class="n">${esc(x.value)}</div><div class="l">${esc(x.label)}</div></div>`).join('')}</div>` : '';
}
function roleItem(r, lead) {
  const dates = first(r.dates, [r.start, r.end].filter(Boolean).join(' – '), r.end, '');
  const meta = [r.location, r.industry].filter(Boolean).join('  ·  ');
  const hl = (r.highlights || r.bullets || []).slice(0, lead ? 4 : 3);
  return `<article class="venture${lead ? ' lead' : ''}">
    <div class="v-head"><h3>${esc(r.company || r.title || '')}</h3><span class="r">${esc(r.company ? (r.title || '') : '')}</span>${dates ? `<span class="d">${esc(dates)}</span>` : ''}</div>
    ${meta ? `<div class="v-meta">${esc(meta)}</div>` : ''}
    ${hl.length ? `<ul>${hl.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</article>`;
}
function experience(p) {
  const roles = (p.current_roles || []).concat(p.past_roles || p.experience || []);
  if (!roles.length) return '';
  return `<section class="block"><h2 class="sec-title">${icon('briefcase')} Experience</h2>
    <div class="ventures">${roles.map((r, i) => roleItem(r, i === 0)).join('')}</div></section>`;
}
function productsOrProjects(p) {
  const items = (p.products_conceptualised || []).map((x) => ({ name: x.name, t: x.type, body: (x.scope || []).slice(0, 4).join(' · ') }))
    .concat((p.projects || []).map((x) => ({ name: x.name, t: (x.tech || x.stack || []).join(' · '), body: first(x.description, (x.highlights || [])[0], '') })));
  if (!items.length) return '';
  return `<section class="block"><h2 class="sec-title">${icon('cube')} Products <span class="tick">//</span> Projects</h2>
    <div class="products">${items.slice(0, 4).map((x) => `<article class="product"><h4>${esc(x.name)}</h4><div class="t">${esc(x.t || '')}</div><p>${esc(x.body)}</p></article>`).join('')}</div></section>`;
}
function achievements(p) {
  if (!(p.achievements || []).length) return '';
  return `<section class="block"><h2 class="sec-title">${icon('spark')} Achievements</h2>
    <ul class="ach">${p.achievements.slice(0, 8).map((a) => `<li>${esc(a)}</li>`).join('')}</ul></section>`;
}
function skillsSection(p) {
  const cc = p.core_competencies || p.skills || {};
  const groups = Object.entries(Array.isArray(cc) ? { Skills: cc } : cc).slice(0, 6);
  if (!groups.length) return '';
  return `<section class="block"><h2 class="sec-title">${icon('spark')} Core Competencies</h2>
    <div class="skmatrix">${groups.map(([k, v]) => `<div class="skm"><b>${esc(k.replace(/_/g, ' '))}</b>${esc((Array.isArray(v) ? v : [v]).map((s) => (typeof s === 'string' ? s : s.name)).slice(0, 7).join(' · '))}</div>`).join('')}</div></section>`;
}
function eduCertAwards(p) {
  let h = '';
  if ((p.education || []).length) h += `<section class="block"><h2 class="sec-title">${icon('cap')} Education</h2>${p.education.map((e) => `<div class="row2"><b>${esc(e.degree || '')}${e.field ? `, ${esc(e.field)}` : ''}</b><span>${esc(e.institution || '')}${e.year ? ` · ${esc(String(e.year))}` : ''}</span></div>`).join('')}</section>`;
  if ((p.certifications || []).length) h += `<section class="block"><h2 class="sec-title">${icon('award')} Certifications</h2>${p.certifications.map((c) => `<div class="row2"><b>${esc(c.name)}</b><span>${c.year ? esc(String(c.year)) : ''}${c.score ? ` · ${esc(c.score)}` : ''}</span></div>`).join('')}</section>`;
  if ((p.awards || []).length) h += `<section class="block"><h2 class="sec-title">${icon('star')} Awards</h2><ul class="ach">${p.awards.slice(0, 5).map((a) => `<li>${esc(typeof a === 'string' ? a : a.name)}</li>`).join('')}</ul></section>`;
  return h;
}
function sidebar(p) {
  const id = p.identity || {};
  const cc = p.core_competencies || {};
  const groups = Object.entries(cc).slice(0, 4);
  return `<aside class="aside">
    <div class="monogram">${initials(id.name)}</div>
    <div class="side-name">${esc(id.name)}</div>
    <div class="side-title">${esc(id.headline || '')}</div>
    <div class="side-sec"><h2 class="side-h">${icon('link')} Contact</h2>${contactBlock(id)}</div>
    ${groups.map(([k, v]) => `<div class="side-sec"><h2 class="side-h">${icon('spark')} ${esc(k.replace(/_/g, ' '))}</h2>${pills(v, 6)}</div>`).join('')}
    ${(p.languages || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('globe')} Languages</h2><div class="side-line">${esc(p.languages.join(' · '))}</div></div>` : ''}
    ${(p.open_to || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('spark')} Open To</h2><div class="side-line" style="color:var(--hero-ink)">${esc(p.open_to.join(' · '))}</div></div>` : ''}
  </aside>`;
}

const CSS = `
  .name{ font-size:17pt; font-weight:800; line-height:1.12; }
  .side-name{ font-size:16.5pt; font-weight:800; line-height:1.14; margin:5mm 0 1mm; }
  .side-title{ font-size:8.6pt; color:var(--side-muted); line-height:1.38; margin-bottom:5mm; }
  .banner h1{ font-size:26pt; color:var(--ink); font-weight:800; letter-spacing:-.7px; line-height:1; }
  .banner .role{ font-size:8.8pt; color:var(--accent-deep); font-weight:700; text-transform:uppercase; letter-spacing:.9px; margin-top:1.6mm; }
  .lede{ margin-bottom:4mm; } .metrics{ margin-bottom:4.5mm; } .block{ margin-bottom:4.4mm; }
  .ventures{ display:flex; flex-direction:column; gap:3mm; }
  .venture{ position:relative; padding-left:6mm; border-left:2px solid var(--hairline); }
  .venture::before{ content:''; position:absolute; left:-3.4mm; top:1mm; width:4.4mm; height:4.4mm; border-radius:50%; background:var(--accent); }
  .venture.lead::before{ background:var(--accent); }
  .v-head{ display:flex; flex-wrap:wrap; align-items:baseline; gap:2mm 3mm; }
  .v-head h3{ font-size:11pt; color:var(--ink); font-weight:800; } .v-head .r{ font-size:9pt; color:var(--accent-deep); font-weight:700; }
  .v-head .d{ font-size:8pt; color:var(--ink-soft); margin-left:auto; } .v-meta{ font-size:7.8pt; color:var(--ink-soft); margin:.6mm 0 1mm; }
  .venture ul{ padding-left:4.5mm; font-size:9.2pt; } .venture li{ margin-bottom:.7mm; }
  .products{ display:grid; grid-template-columns:1fr 1fr; gap:3.5mm; }
  .product{ background:var(--surface); border-radius:7px; padding:3.5mm 4mm; border-top:3px solid var(--accent-deep); }
  .product h4{ color:var(--ink); font-size:10.5pt; font-weight:800; } .product .t{ font-size:7.6pt; color:var(--accent-deep); font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin:.4mm 0 1.4mm; }
  .product p{ font-size:8.4pt; color:var(--ink); line-height:1.45; }
  .ach{ list-style:none; padding:0; display:grid; grid-template-columns:1fr 1fr; gap:1.2mm 6mm; }
  .ach li{ position:relative; padding-left:5mm; font-size:9pt; color:var(--ink); } .ach li::before{ content:''; position:absolute; left:0; top:1.6mm; width:2.4mm; height:2.4mm; border-radius:50%; background:var(--accent); }
  .skmatrix{ display:grid; grid-template-columns:1fr 1fr; gap:2mm 5mm; } .skm{ font-size:8.6pt; } .skm b{ display:block; font-size:7.6pt; text-transform:uppercase; letter-spacing:.5px; color:var(--accent-deep); margin-bottom:.6mm; }
  .row2{ display:flex; justify-content:space-between; gap:4mm; font-size:9pt; margin-bottom:1mm; } .row2 b{ color:var(--ink); } .row2 span{ color:var(--ink-soft); }
  /* aside shell text */
  .side-sec{ margin-bottom:4.4mm; } .side-line{ font-size:8.7pt; color:var(--side-ink); }
  /* ---- layout: two-column (right sidebar) ---- */
  .lay-sidebar-right .sheet{ display:grid; grid-template-columns:1fr 64mm; }
  .lay-sidebar-right main{ padding:12mm 10mm 12mm 12mm; order:1; } .lay-sidebar-right .aside{ order:2; padding:12mm 9mm 12mm 9mm; }
  /* ---- layout: single column ---- */
  .lay-single main{ padding:13mm 14mm; } .lay-single .banner{ border-bottom:2.5px solid var(--accent-deep); padding-bottom:3mm; margin-bottom:4mm; }
  .lay-single .topcontact{ display:flex; flex-wrap:wrap; gap:2mm 5mm; font-size:8.6pt; color:var(--ink-soft); margin-top:2mm; }
  .lay-single .topcontact .ic{ color:var(--accent-deep); }
  /* ---- layout: header band ---- */
  .lay-header-band .hband{ background:linear-gradient(120deg,var(--side-from),var(--side-via) 60%,var(--side-to)); color:var(--side-ink); padding:11mm 12mm 8mm; }
  .lay-header-band .hband h1{ font-size:27pt; font-weight:800; letter-spacing:-.6px; }
  .lay-header-band .hband .role{ color:var(--hero-ink); font-size:10pt; font-weight:600; margin-top:1.6mm; }
  .lay-header-band .hband .chips{ display:flex; flex-wrap:wrap; gap:2mm 3mm; margin-top:4mm; }
  .lay-header-band .hband .chip{ font-size:8.4pt; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); padding:1.2mm 3mm; border-radius:16px; color:var(--side-ink); }
  .lay-header-band main{ padding:9mm 12mm 12mm; }
  .lay-header-band .metrics{ margin-top:-4mm; margin-bottom:5mm; position:relative; z-index:2; }
`;

function bannerHead(id) {
  return `<div class="banner"><h1>${esc(id.name)}</h1><div class="role">${esc((id.headline || '').split('|')[0].trim())}</div></div>`;
}

function render(p, ctx = {}) {
  const id = p.identity || {};
  const design = ctx.design || { theme: ctx.theme, family: 'sidebar-right' };
  const family = design.family || 'sidebar-right';
  const mainInner = `${bannerHead(id)}${lede(p)}${metricStrip(p)}${experience(p)}${productsOrProjects(p)}${achievements(p)}${skillsSection(p)}${eduCertAwards(p)}`;

  let body;
  if (family === 'single') {
    const contact = ['location', 'email', 'phone', 'linkedin', 'website', 'github'].map((k) => id[k]).filter(Boolean);
    body = `<div class="sheet"><main>
      <div class="banner"><h1>${esc(id.name)}</h1><div class="role">${esc((id.headline || '').split('|')[0].trim())}</div>
      <div class="topcontact">${contact.map((c, i) => `${icon(['pin', 'mail', 'phone', 'linkedin', 'globe', 'code'][i] || 'link')}<span>${esc(require('../helpers').cleanUrl(c))}</span>`).join('')}</div></div>
      ${lede(p)}${metricStrip(p)}${experience(p)}${productsOrProjects(p)}${achievements(p)}${skillsSection(p)}${eduCertAwards(p)}
    </main></div>`;
  } else if (family === 'header-band') {
    const cl = require('../helpers').cleanUrl;
    const chip = (v) => (v ? `<span class="chip">${esc(v)}</span>` : '');
    body = `<div class="sheet">
      <div class="hband"><h1>${esc(id.name)}</h1><div class="role">${esc(id.headline || '')}</div>
        <div class="chips">${chip(id.location)}${chip(id.email)}${chip(id.phone)}${id.linkedin ? chip(cl(id.linkedin)) : ''}${id.website ? chip(cl(id.website)) : ''}</div></div>
      <main>${metricStrip(p)}${lede(p)}${experience(p)}${productsOrProjects(p)}${achievements(p)}${skillsSection(p)}${eduCertAwards(p)}</main></div>`;
  } else {
    // sidebar-right
    body = `<div class="sheet"><main>${mainInner}</main>${sidebar(p)}</div>`;
  }

  return docShell({
    title: `${id.name} — Resume`,
    css: CSS,
    body,
    design: { ...design, rootClass: `lay-${family}` },
  });
}

module.exports = { render, id: 'universal', label: 'Universal (sidebar-right / single / header-band)' };
