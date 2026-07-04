// General / technical template — a clean, modern two-column resume that suits
// mid-career professionals and individual contributors. The `technical` variant
// leads with a skills matrix and a tech-tagged project list.

'use strict';

const { esc, initials, first, deriveMetrics, cleanUrl } = require('../helpers');
const { icon, pills, docShell, contactBlock } = require('./_components');

const css = `
  .sheet{ display:grid; grid-template-columns:64mm 1fr; }
  .aside{ padding:12mm 8mm 12mm 10mm; }
  .name{ font-size:16.5pt; font-weight:800; line-height:1.14; margin:5mm 0 1mm; }
  .head{ font-size:8.6pt; color:var(--side-muted); line-height:1.4; margin-bottom:5.5mm; }
  main{ padding:12mm 11mm 12mm 10mm; }
  .banner{ border-bottom:2px solid var(--side-from); padding-bottom:3mm; margin-bottom:4mm; }
  .banner h1{ font-size:27pt; color:var(--ink); font-weight:800; letter-spacing:-.7px; line-height:1; }
  .banner .role{ font-size:9pt; color:var(--accent-deep); font-weight:700; text-transform:uppercase; letter-spacing:.8px; margin-top:1.6mm; }
  .lede{ margin-bottom:4.5mm; }
  .metrics{ margin-bottom:5mm; }
  .blk{ margin-bottom:5mm; }
  .job{ margin-bottom:3.5mm; }
  .job .top{ display:flex; flex-wrap:wrap; align-items:baseline; gap:2mm 3mm; }
  .job .t{ font-size:11pt; font-weight:800; color:var(--ink); }
  .job .c{ font-size:9pt; color:var(--accent-deep); font-weight:700; }
  .job .d{ font-size:8pt; color:var(--ink-soft); margin-left:auto; }
  .job ul{ padding-left:4.5mm; font-size:9.2pt; margin-top:1mm; }
  .job li{ margin-bottom:.7mm; }
  .matrix{ display:grid; grid-template-columns:1fr 1fr; gap:2mm 5mm; }
  .matrix .m{ font-size:8.6pt; }
  .matrix .m b{ color:var(--ink); display:block; font-size:7.6pt; text-transform:uppercase; letter-spacing:.5px; color:var(--accent-deep); margin-bottom:.8mm; }
  .projects{ display:grid; grid-template-columns:1fr 1fr; gap:3mm; }
  .proj{ background:var(--surface); border-radius:6px; padding:3mm 3.5mm; border-left:3px solid var(--accent); }
  .proj h4{ font-size:10pt; font-weight:800; color:var(--ink); }
  .proj p{ font-size:8.3pt; color:var(--ink); margin:1mm 0; line-height:1.4; }
  .proj .tech{ display:flex; flex-wrap:wrap; gap:1.2mm; }
  .proj .tech span{ font-size:6.8pt; background:rgba(var(--accent-rgb),0.12); color:var(--accent-deep); padding:.5mm 1.8mm; border-radius:7px; }
`;

function job(r) {
  const dates = first(r.dates, [r.start, r.end].filter(Boolean).join(' – '), r.end, '');
  return `<div class="job">
    <div class="top"><span class="t">${esc(r.title || r.role || '')}</span><span class="c">${esc(r.company || '')}</span>${dates ? `<span class="d">${esc(dates)}</span>` : ''}</div>
    ${(r.highlights || r.bullets || []).length ? `<ul>${(r.highlights || r.bullets).slice(0, 4).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
  </div>`;
}

function render(p, ctx = {}) {
  const id = p.identity || {};
  const technical = ctx.classification?.archetype === 'technical' || ctx.variant === 'technical';
  const metrics = deriveMetrics(p, 3);
  const roles = (p.current_roles || []).concat(p.past_roles || p.experience || []);
  const summary = first(p.summary?.long, p.summary?.short, p.personal_brand_statement, '');

  const skillGroups = p.core_competencies || p.skills || {};
  const skillMatrix = Object.entries(skillGroups).slice(0, 6).map(([k, v]) =>
    `<div class="m"><b>${esc(k.replace(/_/g, ' '))}</b>${esc((Array.isArray(v) ? v : [v]).slice(0, 6).join(' · '))}</div>`).join('');

  const projects = (p.projects || []).slice(0, 4).map((pr) => `
    <article class="proj"><h4>${esc(pr.name)}</h4>
      <p>${esc(first(pr.description, (pr.highlights || [])[0], ''))}</p>
      ${(pr.tech || pr.stack) ? `<div class="tech">${(pr.tech || pr.stack).map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}</article>`).join('');

  const body = `
<div class="sheet">
  <aside class="aside">
    <div class="monogram">${initials(id.name)}</div>
    <div class="name">${esc(id.name)}</div>
    <div class="head">${esc(id.headline || '')}</div>
    <div class="side-sec"><h2 class="side-h">${icon('link')} Contact</h2>${contactBlock(id)}</div>
    ${!technical && Object.keys(skillGroups).length ? Object.entries(skillGroups).slice(0, 4).map(([k, v]) => `<div class="side-sec"><h2 class="side-h">${icon('spark')} ${esc(k.replace(/_/g, ' '))}</h2>${pills(Array.isArray(v) ? v : [v], 6)}</div>`).join('') : ''}
    ${(p.education || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('cap')} Education</h2>${p.education.map((e) => `<div class="side-line"><strong>${esc(e.degree || '')}</strong>${e.field ? ` — ${esc(e.field)}` : ''}${e.institution ? `<br><span style="color:var(--side-muted)">${esc(e.institution)}${e.year ? `, ${e.year}` : ''}</span>` : ''}</div>`).join('')}</div>` : ''}
    ${(p.certifications || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('award')} Certifications</h2>${p.certifications.map((c) => `<div class="side-line"><strong>${esc(c.name)}</strong>${c.year ? ` (${c.year})` : ''}</div>`).join('')}</div>` : ''}
    ${(p.languages || []).length ? `<div class="side-sec"><h2 class="side-h">${icon('globe')} Languages</h2><div class="side-line">${esc(p.languages.join(' · '))}</div></div>` : ''}
  </aside>

  <main>
    <div class="banner"><h1>${esc(id.name)}</h1><div class="role">${esc((id.headline || '').split('|')[0].trim())}</div></div>
    ${summary ? `<div class="lede">${esc(summary)}</div>` : ''}
    ${metrics.length ? `<div class="metrics" style="--mcols:${metrics.length}">${metrics.map((m) => `<div class="metric"><div class="n">${esc(m.value)}</div><div class="l">${esc(m.label)}</div></div>`).join('')}</div>` : ''}

    ${technical && skillMatrix ? `<section class="blk"><h2 class="sec-title">${icon('code')} Technical Skills</h2><div class="matrix">${skillMatrix}</div></section>` : ''}

    ${roles.length ? `<section class="blk"><h2 class="sec-title">${icon('briefcase')} Experience</h2>${roles.slice(0, 6).map(job).join('')}</section>` : ''}

    ${projects ? `<section class="blk"><h2 class="sec-title">${icon('cube')} Projects</h2><div class="projects">${projects}</div></section>` : ''}

    ${(p.achievements || []).length ? `<section class="blk"><h2 class="sec-title">${icon('star')} Achievements</h2><ul style="padding-left:5mm; font-size:9.2pt">${p.achievements.slice(0, 6).map((a) => `<li style="margin-bottom:1mm">${esc(a)}</li>`).join('')}</ul></section>` : ''}
  </main>
</div>`;

  return docShell({ title: `${id.name} — Resume`, css, body, design: ctx.design || { theme: ctx.theme } });
}

module.exports = { render, id: 'general', label: 'General / Technical' };
