// Fresher / early-career template — energetic yet professional, engineered to
// be *noticed* in a large CV stack. Bold hero band, a strengths spotlight,
// leveled skill bars, and a projects grid (a fresher's best differentiator).

'use strict';

const { esc, initials, first, wordCount } = require('../helpers');
const { icon, pills, docShell } = require('./_components');

const css = `
  .sheet{ display:flex; flex-direction:column; }
  .hero{ background:linear-gradient(120deg,var(--side-from) 0%,var(--side-via) 55%,var(--side-to) 100%); color:var(--side-ink); padding:11mm 12mm 9mm; position:relative; overflow:hidden; }
  .hero::after{ content:''; position:absolute; inset:0; background:radial-gradient(circle at 88% -10%, rgba(var(--accent-rgb),0.4), transparent 40%); pointer-events:none; }
  .hero-top{ display:flex; align-items:center; gap:6mm; position:relative; z-index:1; }
  .hero .monogram{ width:22mm; height:22mm; border-radius:20px; font-size:26pt; }
  .hero h1{ font-size:30pt; font-weight:800; letter-spacing:-.8px; line-height:1; }
  .hero .tagline{ font-size:11pt; color:var(--hero-ink); font-weight:600; margin-top:2mm; }
  .hero .chips{ display:flex; flex-wrap:wrap; gap:2mm 4mm; margin-top:5mm; position:relative; z-index:1; }
  .hero .chip{ display:flex; align-items:center; gap:1.8mm; font-size:8.6pt; color:var(--side-ink); background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.18); padding:1.4mm 3mm; border-radius:20px; }
  .hero .chip .ic{ color:var(--accent); }
  .spotlight{ display:grid; grid-template-columns:repeat(var(--scols,3),1fr); gap:0; background:var(--accent-deep); color:var(--accent-text); }
  .spotlight .s{ padding:3.5mm 5mm; border-right:1px solid rgba(255,255,255,0.22); }
  .spotlight .s:last-child{ border-right:none; }
  .spotlight .s .n{ font-size:13pt; font-weight:800; line-height:1; }
  .spotlight .s .l{ font-size:7.4pt; text-transform:uppercase; letter-spacing:.6px; margin-top:1.2mm; opacity:.92; }
  .body{ display:grid; grid-template-columns:62mm 1fr; }
  .col-l{ background:var(--surface); padding:9mm 8mm; }
  .col-r{ padding:9mm 10mm; }
  .col-l .sec-title,.col-r .sec-title{ font-size:10pt; }
  .blk{ margin-bottom:6mm; }
  .obj{ background:linear-gradient(90deg,rgba(var(--accent-rgb),0.14),rgba(var(--accent-rgb),0)); border-left:3px solid var(--accent); padding:3.5mm 4.5mm; border-radius:0 5px 5px 0; font-size:10pt; line-height:1.55; margin-bottom:6mm; }
  .skill{ margin-bottom:2.6mm; }
  .skill .row{ display:flex; justify-content:space-between; font-size:8.4pt; margin-bottom:1mm; color:var(--ink); }
  .skill .track{ height:3.4mm; background:rgba(var(--accent-rgb),0.15); border-radius:4px; overflow:hidden; }
  .skill .fill{ height:100%; background:linear-gradient(90deg,var(--accent),var(--accent-deep)); border-radius:4px; }
  .edu-card{ background:var(--bg); border:1px solid var(--hairline); border-left:3px solid var(--accent); border-radius:5px; padding:3mm 3.5mm; margin-bottom:2.5mm; }
  .edu-card .d{ font-size:11pt; font-weight:800; color:var(--ink); }
  .edu-card .i{ font-size:8.4pt; color:var(--ink-soft); margin-top:.6mm; }
  .edu-card .g{ font-size:8.4pt; color:var(--accent-deep); font-weight:700; margin-top:.6mm; }
  .side-line{ color:var(--ink); }
  .side-line strong{ color:var(--ink); }
  .projects{ display:grid; grid-template-columns:1fr 1fr; gap:3.5mm; }
  .proj{ background:var(--surface); border-radius:7px; padding:3.5mm 4mm; border-top:3px solid var(--accent); }
  .proj h4{ font-size:10.5pt; font-weight:800; color:var(--ink); display:flex; align-items:center; gap:1.6mm; }
  .proj p{ font-size:8.4pt; color:var(--ink); line-height:1.45; margin:1.4mm 0; }
  .proj .tech{ display:flex; flex-wrap:wrap; gap:1.2mm; }
  .proj .tech span{ font-size:7pt; background:rgba(var(--accent-rgb),0.12); color:var(--accent-deep); padding:.6mm 2mm; border-radius:8px; }
  .xp{ position:relative; padding-left:5.5mm; border-left:2px solid var(--hairline); margin-bottom:3mm; }
  .xp::before{ content:''; position:absolute; left:-3mm; top:1mm; width:4mm; height:4mm; border-radius:50%; background:var(--accent); }
  .xp h4{ font-size:10pt; font-weight:800; color:var(--ink); }
  .xp .m{ font-size:8pt; color:var(--accent-deep); font-weight:600; margin-bottom:1mm; }
  .xp ul{ padding-left:4.5mm; font-size:8.8pt; }
  .ach{ list-style:none; padding:0; }
  .ach li{ position:relative; padding-left:5mm; font-size:9pt; margin-bottom:1.2mm; color:var(--ink); }
  .ach li::before{ content:''; position:absolute; left:0; top:1.6mm; width:2.4mm; height:2.4mm; border-radius:50%; background:var(--accent); }
`;

// Normalize skills into { name, level 0..100 } list.
function skillList(p) {
  if (Array.isArray(p.skills)) {
    return p.skills.map((s) => (typeof s === 'string' ? { name: s, level: 78 } : { name: s.name, level: s.level ?? 78 }));
  }
  if (p.skills && typeof p.skills === 'object') {
    return Object.values(p.skills).flat().slice(0, 8).map((s) => (typeof s === 'string' ? { name: s, level: 78 } : s));
  }
  const cc = p.core_competencies ? Object.values(p.core_competencies).flat() : [];
  return cc.slice(0, 8).map((s, i) => ({ name: s, level: 88 - i * 4 }));
}

function spotlight(p, cls) {
  const items = [];
  const y = cls.yearsExperience;
  if ((p.education || [])[0]) items.push({ n: p.education[0].degree || 'Graduate', l: p.education[0].field || 'Education' });
  if ((p.projects || []).length) items.push({ n: `${p.projects.length}`, l: 'Projects built' });
  if ((p.internships || []).length) items.push({ n: `${p.internships.length}`, l: 'Internships' });
  if ((p.awards || []).length) items.push({ n: `${p.awards.length}`, l: 'Awards & honors' });
  if (items.length < 3 && (p.core_competencies || p.skills)) items.push({ n: `${skillList(p).length}+`, l: 'Core skills' });
  return items.slice(0, 4);
}

function render(p, ctx = {}) {
  const id = p.identity || {};
  const cls = ctx.classification || {};
  const tagline = first(p.identity?.headline, p.career_objective, 'Early-career professional');
  const objective = first(p.career_objective, p.summary?.long, p.summary?.short, p.personal_brand_statement, '');
  const skills = skillList(p);
  const spots = spotlight(p, cls);

  const chip = (ic, v) => (v ? `<span class="chip">${icon(ic)}${esc(v)}</span>` : '');
  const projects = (p.projects || []).slice(0, 4).map((pr) => `
    <article class="proj">
      <h4>${icon('cube')} ${esc(pr.name)}</h4>
      <p>${esc(first(pr.description, (pr.highlights || [])[0], ''))}</p>
      ${(pr.tech || pr.stack) ? `<div class="tech">${(pr.tech || pr.stack).map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    </article>`).join('');

  const experience = (p.internships || []).concat(p.current_roles || [], p.past_roles || []).slice(0, 4).map((r) => `
    <div class="xp">
      <h4>${esc(r.title || r.role || '')}${r.company ? ` · ${esc(r.company)}` : ''}</h4>
      <div class="m">${esc(first(r.dates, [r.start, r.end].filter(Boolean).join(' – '), ''))}</div>
      ${(r.highlights || []).length ? `<ul>${r.highlights.slice(0, 2).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
    </div>`).join('');

  const body = `
<div class="sheet">
  <div class="hero">
    <div class="hero-top">
      <div class="monogram">${initials(id.name)}</div>
      <div>
        <h1>${esc(id.name)}</h1>
        <div class="tagline">${esc(tagline)}</div>
      </div>
    </div>
    <div class="chips">
      ${chip('pin', id.location)}${chip('mail', id.email)}${chip('phone', id.phone)}
      ${id.linkedin ? chip('linkedin', require('../helpers').cleanUrl(id.linkedin)) : ''}
      ${id.github ? chip('code', require('../helpers').cleanUrl(id.github)) : ''}
      ${id.portfolio ? chip('link', require('../helpers').cleanUrl(id.portfolio)) : ''}
    </div>
  </div>

  ${spots.length >= 2 ? `<div class="spotlight" style="--scols:${spots.length}">
    ${spots.map((s) => `<div class="s"><div class="n">${esc(s.n)}</div><div class="l">${esc(s.l)}</div></div>`).join('')}
  </div>` : ''}

  <div class="body">
    <div class="col-l">
      ${skills.length ? `<div class="blk"><h2 class="sec-title">${icon('spark')} Skills</h2>
        ${skills.map((s) => `<div class="skill"><div class="row"><span>${esc(s.name)}</span></div><div class="track"><div class="fill" style="width:${Math.max(35, Math.min(100, s.level))}%"></div></div></div>`).join('')}</div>` : ''}

      ${(p.certifications || []).length ? `<div class="blk"><h2 class="sec-title">${icon('award')} Certifications</h2>
        ${p.certifications.map((c) => `<div class="side-line" style="margin-bottom:2mm"><strong>${esc(c.name)}</strong>${c.year ? ` (${esc(String(c.year))})` : ''}${c.score ? ` — ${esc(c.score)}` : ''}</div>`).join('')}</div>` : ''}

      ${(p.languages || []).length ? `<div class="blk"><h2 class="sec-title">${icon('globe')} Languages</h2>
        <div class="side-line">${esc(p.languages.join(' · '))}</div></div>` : ''}

      ${(p.interests || []).length ? `<div class="blk"><h2 class="sec-title">${icon('heart')} Interests</h2>
        ${pills(p.interests, 8)}</div>` : ''}
    </div>

    <div class="col-r">
      ${objective ? `<div class="obj">${esc(objective)}</div>` : ''}

      ${(p.education || []).length ? `<div class="blk"><h2 class="sec-title">${icon('cap')} Education</h2>
        ${p.education.map((e) => `<div class="edu-card"><div class="d">${esc(e.degree || '')}${e.field ? ` in ${esc(e.field)}` : ''}</div><div class="i">${esc(e.institution || '')}${e.year ? ` · ${esc(String(e.year))}` : ''}</div>${e.score || e.gpa ? `<div class="g">${esc(e.score || e.gpa)}</div>` : ''}</div>`).join('')}</div>` : ''}

      ${projects ? `<div class="blk"><h2 class="sec-title">${icon('cube')} Projects</h2>
        <div class="projects">${projects}</div></div>` : ''}

      ${experience ? `<div class="blk"><h2 class="sec-title">${icon('briefcase')} Experience & Internships</h2>
        ${experience}</div>` : ''}

      ${(p.achievements || []).concat(p.awards || []).length ? `<div class="blk"><h2 class="sec-title">${icon('star')} Achievements & Awards</h2>
        <ul class="ach">${(p.achievements || []).concat(p.awards || []).slice(0, 6).map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
    </div>
  </div>
</div>`;

  return docShell({ title: `${id.name} — Resume`, css, body, design: ctx.design || { theme: ctx.theme } });
}

module.exports = { render, id: 'fresher', label: 'Fresher / Early-career' };
