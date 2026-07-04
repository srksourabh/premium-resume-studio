// Academic CV template — restrained, publication-forward, single main column
// with a slim contact/skills rail. Serif headings for scholarly tone.

'use strict';

const { esc, first, cleanUrl } = require('../helpers');
const { icon, pills, docShell } = require('./_components');

const css = `
  body{ font-size:10pt; }
  .sheet{ display:grid; grid-template-columns:56mm 1fr; }
  .rail{ background:var(--surface); padding:12mm 8mm; border-right:1px solid var(--hairline); }
  .rail .name-sm{ font-family:Georgia,'Liberation Serif','Times New Roman',serif; font-size:15pt; font-weight:700; color:var(--ink); line-height:1.15; }
  .rail .role-sm{ font-size:8.4pt; color:var(--accent-deep); font-weight:600; margin:1mm 0 5mm; }
  .rail .side-h{ color:var(--accent-deep); border-bottom-color:var(--hairline); }
  .rail .contact-row{ color:var(--ink); }
  .rail .contact-row .ic{ color:var(--accent-deep); }
  .rail .pill{ background:rgba(var(--accent-rgb),0.08); color:var(--accent-deep); border-color:rgba(var(--accent-rgb),0.25); }
  main{ padding:12mm 12mm 12mm 11mm; }
  .cv-name{ font-family:Georgia,'Liberation Serif','Times New Roman',serif; font-size:26pt; font-weight:700; color:var(--ink); letter-spacing:-.3px; }
  .cv-head{ font-size:10pt; color:var(--accent-deep); font-weight:600; margin:1mm 0 4mm; padding-bottom:3mm; border-bottom:2px solid var(--accent); }
  .sec{ margin-bottom:5mm; }
  .sec h2{ font-family:Georgia,'Liberation Serif','Times New Roman',serif; font-size:12pt; color:var(--ink); font-weight:700; margin-bottom:2.5mm; padding-bottom:1mm; border-bottom:1px solid var(--hairline); display:flex; align-items:center; gap:2mm; }
  .sec h2 .ic{ color:var(--accent-deep); }
  .stmt{ font-size:9.8pt; line-height:1.6; color:var(--ink); text-align:justify; }
  .entry{ margin-bottom:3mm; }
  .entry .top{ display:flex; justify-content:space-between; gap:4mm; }
  .entry .t{ font-size:10.5pt; font-weight:700; color:var(--ink); }
  .entry .d{ font-size:8.6pt; color:var(--ink-soft); white-space:nowrap; }
  .entry .i{ font-size:9pt; color:var(--accent-deep); font-style:italic; }
  .entry ul{ padding-left:5mm; font-size:9pt; margin-top:1mm; }
  .pubs{ counter-reset:pub; list-style:none; padding:0; }
  .pubs li{ counter-increment:pub; position:relative; padding-left:8mm; font-size:9pt; margin-bottom:2mm; line-height:1.45; color:var(--ink); }
  .pubs li::before{ content:'[' counter(pub) ']'; position:absolute; left:0; color:var(--accent-deep); font-weight:700; }
  .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:1mm 6mm; }
  .grid2 .g{ font-size:9pt; padding-left:4mm; position:relative; color:var(--ink); margin-bottom:1mm; }
  .grid2 .g::before{ content:'▪'; color:var(--accent-deep); position:absolute; left:0; }
`;

function entry(e) {
  const t = first(e.title, e.degree, e.role, e.name, '');
  const inst = first(e.institution, e.company, e.venue, e.organization, '');
  const dates = first(e.dates, e.year, [e.start, e.end].filter(Boolean).join(' – '), '');
  const bullets = e.highlights || e.details || [];
  return `<div class="entry">
    <div class="top"><span class="t">${esc(t)}${e.field ? `, ${esc(e.field)}` : ''}</span>${dates ? `<span class="d">${esc(String(dates))}</span>` : ''}</div>
    ${inst ? `<div class="i">${esc(inst)}</div>` : ''}
    ${bullets.length ? `<ul>${bullets.slice(0, 3).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  </div>`;
}

function render(p, ctx = {}) {
  const id = p.identity || {};
  const contact = [];
  const add = (ic, v) => v && contact.push(`<div class="contact-row">${icon(ic)}<span>${esc(v)}</span></div>`);
  add('pin', id.location); add('mail', id.email); add('phone', id.phone);
  if (id.linkedin) add('linkedin', cleanUrl(id.linkedin));
  if (id.website) add('globe', cleanUrl(id.website));

  const skills = p.core_competencies ? Object.values(p.core_competencies).flat() : (p.skills ? Object.values(p.skills).flat() : []);
  const statement = first(p.research_statement, p.summary?.long, p.summary?.short, '');

  const body = `
<div class="sheet">
  <aside class="rail">
    <div class="name-sm">${esc(id.name)}</div>
    <div class="role-sm">${esc(id.headline || '')}</div>
    <div class="side-sec"><h2 class="side-h">Contact</h2>${contact.join('')}</div>
    ${(p.affiliations || []).length ? `<div class="side-sec"><h2 class="side-h">Affiliations</h2>${p.affiliations.map((a) => `<div class="contact-row">${esc(a)}</div>`).join('')}</div>` : ''}
    ${skills.length ? `<div class="side-sec"><h2 class="side-h">Skills & Methods</h2>${pills(skills, 16)}</div>` : ''}
    ${(p.languages || []).length ? `<div class="side-sec"><h2 class="side-h">Languages</h2><div class="contact-row">${esc(p.languages.join(' · '))}</div></div>` : ''}
    ${(p.memberships || []).length ? `<div class="side-sec"><h2 class="side-h">Memberships</h2>${p.memberships.map((m) => `<div class="contact-row" style="margin-bottom:1mm">${esc(m)}</div>`).join('')}</div>` : ''}
  </aside>

  <main>
    <div class="cv-name">${esc(id.name)}</div>
    <div class="cv-head">${esc(id.headline || '')}</div>

    ${statement ? `<section class="sec"><h2>${icon('flask')} Research Statement</h2><p class="stmt">${esc(statement)}</p></section>` : ''}

    ${(p.education || []).length ? `<section class="sec"><h2>${icon('cap')} Education</h2>${p.education.map(entry).join('')}</section>` : ''}

    ${(p.appointments || p.current_roles || []).length ? `<section class="sec"><h2>${icon('briefcase')} Appointments</h2>${(p.appointments || p.current_roles).map(entry).join('')}</section>` : ''}

    ${(p.publications || []).length ? `<section class="sec"><h2>${icon('book')} Selected Publications</h2>
      <ol class="pubs">${p.publications.map((pub) => `<li>${esc(typeof pub === 'string' ? pub : `${pub.authors || ''} ${pub.title ? `“${pub.title}.”` : ''} ${pub.venue || ''} ${pub.year || ''}`.trim())}</li>`).join('')}</ol></section>` : ''}

    ${(p.grants || p.awards || []).length ? `<section class="sec"><h2>${icon('award')} Grants, Awards & Honors</h2>
      <div class="grid2">${(p.grants || p.awards).map((g) => `<div class="g">${esc(typeof g === 'string' ? g : `${g.name || ''} ${g.year ? `(${g.year})` : ''}`)}</div>`).join('')}</div></section>` : ''}

    ${(p.teaching || []).length ? `<section class="sec"><h2>${icon('star')} Teaching</h2>${p.teaching.map(entry).join('')}</section>` : ''}

    ${(p.conferences || p.presentations || []).length ? `<section class="sec"><h2>${icon('spark')} Presentations</h2>
      <div class="grid2">${(p.conferences || p.presentations).map((c) => `<div class="g">${esc(typeof c === 'string' ? c : `${c.title || ''} — ${c.venue || ''} ${c.year || ''}`)}</div>`).join('')}</div></section>` : ''}
  </main>
</div>`;

  return docShell({ title: `${id.name} — Curriculum Vitae`, css, body, design: ctx.design || { theme: ctx.theme } });
}

module.exports = { render, id: 'academic', label: 'Academic CV' };
