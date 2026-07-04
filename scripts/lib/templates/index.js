// Template registry — maps an archetype to its renderer, with graceful
// fallbacks. Also provides an ATS-safe plain-text export.

'use strict';

const executive = require('./executive');
const academic = require('./academic');
const fresher = require('./fresher');
const general = require('./general');
const universal = require('./universal');

const REGISTRY = {
  executive,
  academic,
  fresher,
  technical: general, // general handles the technical variant
  creative: fresher, // creative early-career shares the fresher's expressive layout
  general,
};

// Renderers addressable by name (the design catalog routes by renderer, not archetype).
const RENDERERS = { executive, academic, fresher, general, universal };

function getTemplate(archetype) {
  return REGISTRY[archetype] || general;
}

function getRenderer(name) {
  return RENDERERS[name] || general;
}

function listTemplates() {
  return [...new Set(Object.values(REGISTRY))].map((t) => ({ id: t.id, label: t.label }));
}

/**
 * ATS-safe plain-text resume. No columns, no glyphs — just the content an
 * applicant-tracking parser can read cleanly. Emitted alongside the PDF.
 */
function atsText(p) {
  const id = p.identity || {};
  const L = [];
  const rule = () => L.push('='.repeat(64));
  const h = (t) => { L.push(''); L.push(t.toUpperCase()); L.push('-'.repeat(t.length)); };

  L.push(id.name || '');
  if (id.headline) L.push(id.headline);
  const contact = ['location', 'email', 'phone', 'linkedin', 'website']
    .map((k) => id[k]).filter(Boolean).join(' | ');
  if (contact) L.push(contact);
  rule();

  const summary = p.summary?.long || p.summary?.short || p.personal_brand_statement;
  if (summary) { h('Summary'); L.push(summary); }

  const roles = (p.current_roles || []).concat(p.past_roles || p.experience || []);
  if (roles.length) {
    h('Experience');
    for (const r of roles) {
      const dates = r.dates || [r.start, r.end].filter(Boolean).join(' - ');
      L.push(`${r.title || r.role || ''}${r.company ? `, ${r.company}` : ''}${dates ? ` (${dates})` : ''}`);
      for (const b of (r.highlights || r.bullets || [])) L.push(`  - ${b}`);
    }
  }

  if ((p.projects || []).length) {
    h('Projects');
    for (const pr of p.projects) {
      L.push(`${pr.name}${(pr.tech || pr.stack) ? ` [${(pr.tech || pr.stack).join(', ')}]` : ''}`);
      const d = pr.description || (pr.highlights || [])[0];
      if (d) L.push(`  - ${d}`);
    }
  }

  if ((p.education || []).length) {
    h('Education');
    for (const e of p.education) {
      L.push(`${e.degree || ''}${e.field ? ` in ${e.field}` : ''}${e.institution ? `, ${e.institution}` : ''}${e.year ? ` (${e.year})` : ''}`);
    }
  }

  const skills = p.core_competencies
    ? Object.values(p.core_competencies).flat()
    : (p.skills ? Object.values(p.skills).flat().map((s) => (typeof s === 'string' ? s : s.name)) : []);
  if (skills.length) { h('Skills'); L.push(skills.join(', ')); }

  if ((p.certifications || []).length) {
    h('Certifications');
    for (const c of p.certifications) L.push(`${c.name}${c.year ? ` (${c.year})` : ''}${c.score ? ` - ${c.score}` : ''}`);
  }
  if ((p.achievements || []).length) { h('Achievements'); for (const a of p.achievements) L.push(`- ${a}`); }
  if ((p.awards || []).length) { h('Awards'); for (const a of p.awards) L.push(`- ${typeof a === 'string' ? a : a.name}`); }
  if ((p.languages || []).length) { h('Languages'); L.push(p.languages.join(', ')); }

  return L.join('\n') + '\n';
}

module.exports = { getTemplate, getRenderer, listTemplates, atsText, REGISTRY };
