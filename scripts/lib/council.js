// The Model Council — a deterministic, multi-persona rubric that scores a
// resume profile 0–100 and returns actionable fixes. It plays the role of a
// panel of reviewers (Executive Recruiter, ATS parser, Domain Expert, Design
// Critic, Hiring CEO). The Studio loops — research, rewrite, re-render — until
// the absolute score clears the threshold (default 85).
//
// This code gives an objective, reproducible floor. The SKILL.md layers a
// qualitative LLM council on top for judgement calls; the two agree by design
// because both reward the same things: quantified impact, strong verbs,
// completeness, no placeholders, and archetype-appropriate structure.

'use strict';

const {
  isPlaceholder,
  startsWithActionVerb,
  isQuantified,
  wordCount,
  WEAK_OPENERS,
} = require('./helpers');
const { lintProfile } = require('./humanize');

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Collect every bullet across roles / achievements / projects. */
function allBullets(p) {
  const b = [];
  (p.current_roles || []).forEach((r) => (r.highlights || []).forEach((h) => b.push(h)));
  (p.past_roles || p.experience || []).forEach((r) => (r.highlights || r.bullets || []).forEach((h) => b.push(h)));
  (p.appointments || []).forEach((r) => (r.highlights || r.bullets || []).forEach((h) => b.push(h)));
  (p.projects || []).forEach((pr) => (pr.highlights || (pr.description ? [pr.description] : [])).forEach((h) => b.push(h)));
  (p.internships || []).forEach((i) => (i.highlights || []).forEach((h) => b.push(h)));
  return b.filter(Boolean);
}

// Each dimension returns { score:0..100, weight, notes:[], fixes:[] }.
const DIMENSIONS = {
  contactability(p) {
    const id = p.identity || {};
    const have = ['email', 'phone', 'location'].filter((k) => id[k] && !isPlaceholder(id[k]));
    const links = ['linkedin', 'website', 'portfolio', 'github'].filter((k) => id[k] && !isPlaceholder(id[k]));
    let score = have.length / 3 * 70 + Math.min(1, links.length) * 30;
    const fixes = [];
    if (!id.email || isPlaceholder(id.email)) fixes.push('Add a professional email address.');
    if (!id.phone || isPlaceholder(id.phone)) fixes.push('Add a reachable phone number.');
    if (!links.length) fixes.push('Add at least one live link (LinkedIn / website / portfolio).');
    return { score: clamp(score), weight: 8, notes: [`${have.length}/3 core contacts, ${links.length} link(s)`], fixes };
  },

  positioning(p) {
    const h = p.identity?.headline || '';
    const w = wordCount(h);
    let score = 0;
    const fixes = [];
    if (h && !isPlaceholder(h)) score += 45;
    else fixes.push('Write a sharp professional headline (role + domain + value).');
    if (w >= 4 && w <= 16) score += 30;
    else if (h) fixes.push('Tighten the headline to ~6–14 words.');
    if (/[|•·—-]/.test(h)) score += 10; // structured, segmented headline
    if ((p.summary?.long || p.summary?.short) && !isPlaceholder(p.summary?.long || p.summary?.short)) score += 15;
    else fixes.push('Add a 2–4 line professional summary.');
    return { score: clamp(score), weight: 10, notes: [`headline ${w} words`], fixes };
  },

  impact(p) {
    const bullets = allBullets(p);
    if (!bullets.length) return { score: 30, weight: 18, notes: ['no achievement bullets found'], fixes: ['Add achievement bullets with measurable results.'] };
    const q = bullets.filter(isQuantified).length;
    const ratio = q / bullets.length;
    const metrics = (p.metrics || []).length;
    let score = ratio * 80 + Math.min(20, metrics * 7);
    const fixes = [];
    if (ratio < 0.5) fixes.push(`Quantify more bullets — only ${q}/${bullets.length} carry a number, %, ₹/$ or scale. Aim for >60%.`);
    if (!metrics) fixes.push('Add 3–4 headline metrics (revenue, growth %, team size, reach) for the hero strip.');
    return { score: clamp(score), weight: 18, notes: [`${q}/${bullets.length} bullets quantified`, `${metrics} hero metrics`], fixes };
  },

  actionVerbs(p) {
    const bullets = allBullets(p);
    if (!bullets.length) return { score: 40, weight: 10, notes: [], fixes: [] };
    const strong = bullets.filter(startsWithActionVerb).length;
    const weak = bullets.filter((b) => WEAK_OPENERS.some((w) => b.toLowerCase().trim().startsWith(w))).length;
    let score = (strong / bullets.length) * 100 - weak * 8;
    const fixes = [];
    if (strong / bullets.length < 0.6) fixes.push(`Start more bullets with strong verbs (Led, Scaled, Built…) — ${strong}/${bullets.length} do now.`);
    if (weak) fixes.push(`Rewrite ${weak} passive opener(s) ("responsible for", "worked on").`);
    return { score: clamp(score), weight: 10, notes: [`${strong} strong / ${weak} weak openers`], fixes };
  },

  humanVoice(p) {
    const { score, counts } = lintProfile(p);
    const fixes = [];
    if (counts.cliche) fixes.push(`Cut ${counts.cliche} cliché(s) (results-driven, human-centric, "ready for the future"…) — say the specific thing instead.`);
    if (counts.buzz) fixes.push(`Replace ${counts.buzz} buzzword(s) (leverage, spearheaded, utilize, seamless…) with plain verbs.`);
    if (counts.soup) fixes.push(`Break up ${counts.soup} keyword-soup list(s) into a real sentence about what you did.`);
    if (counts.filler) fixes.push(`Remove ${counts.filler} filler phrase(s) ("responsible for", "various", "a range of").`);
    if (counts.uniform) fixes.push('Vary how bullets open — too many start with the same verb, which reads templated.');
    return { score, weight: 14, notes: [`${counts.cliche} clichés, ${counts.buzz} buzzwords, ${counts.soup} soup`], fixes };
  },

  completeness(p, ctx) {
    const arch = ctx.classification?.archetype || 'general';
    const required = {
      executive: ['current_roles', 'achievements', 'core_competencies'],
      academic: ['education', 'publications', 'research|research_statement|research_interests'],
      fresher: ['education', 'skills|core_competencies', 'projects|internships'],
      technical: ['skills|core_competencies', 'projects|current_roles'],
      creative: ['projects|current_roles', 'skills|core_competencies'],
      general: ['current_roles|experience', 'core_competencies|skills', 'education'],
    }[arch] || ['current_roles', 'education'];

    const has = (key) => key.split('|').some((k) => {
      const v = p[k];
      return Array.isArray(v) ? v.length : v && Object.keys(v).length;
    });
    const present = required.filter(has);
    const missing = required.filter((k) => !has(k));
    const score = (present.length / required.length) * 100;
    const fixes = missing.map((m) => `Add a "${m.split('|')[0]}" section — expected for an ${arch} resume.`);
    return { score: clamp(score), weight: 12, notes: [`${present.length}/${required.length} expected sections for ${arch}`], fixes };
  },

  atsCoverage(p, ctx) {
    // Skill keyword breadth + whether a plain-text ATS variant is emitted.
    const compet = p.core_competencies ? Object.values(p.core_competencies).flat() : [];
    const skills = compet.concat(p.skills ? Object.values(p.skills).flat() : []);
    const uniq = new Set(skills.map((s) => String(s).toLowerCase()));
    let score = Math.min(70, uniq.size * 3.5);
    if (ctx.atsVariant) score += 30; // an ATS-safe text export exists
    else score += 10;
    const fixes = [];
    if (uniq.size < 12) fixes.push('Broaden the skills/keywords so ATS keyword-matching finds you (aim 15–25 distinct terms).');
    if (!ctx.atsVariant) fixes.push('Also export an ATS-safe plain-text version (the designed PDF is for humans).');
    return { score: clamp(score), weight: 10, notes: [`${uniq.size} distinct skill keywords`], fixes };
  },

  brevity(p) {
    const bullets = allBullets(p);
    if (!bullets.length) return { score: 60, weight: 8, notes: [], fixes: [] };
    const lens = bullets.map(wordCount);
    const good = lens.filter((l) => l >= 8 && l <= 30).length;
    const tooLong = lens.filter((l) => l > 34).length;
    let score = (good / bullets.length) * 100 - tooLong * 6;
    const fixes = [];
    if (tooLong) fixes.push(`Split or trim ${tooLong} over-long bullet(s) (>34 words).`);
    if (good / bullets.length < 0.6) fixes.push('Aim for punchy 1–2 line bullets (8–30 words).');
    return { score: clamp(score), weight: 8, notes: [`${good}/${bullets.length} bullets well-sized`], fixes };
  },

  credibility(p) {
    // Penalize visible placeholders / unresolved fields that leak into output.
    const blob = JSON.stringify({
      identity: p.identity, roles: p.current_roles, edu: p.education, certs: p.certifications,
    });
    const hits = (blob.match(/pending|tbd|to be confirmed|placeholder|unknown|null/gi) || []).length;
    const pend = (p.pending_confirmations || []).length;
    let score = 100 - hits * 9 - pend * 3;
    const fixes = [];
    if (hits) fixes.push(`Resolve ${hits} placeholder/"pending" value(s) before export (research or ask the user).`);
    if (pend) fixes.push(`Confirm or remove ${pend} item(s) in pending_confirmations.`);
    return { score: clamp(score), weight: 10, notes: [`${hits} placeholder tokens, ${pend} pending`], fixes };
  },

  designFit(p, ctx) {
    const c = ctx.classification || {};
    let score = 55;
    const fixes = [];
    if (ctx.themeMatchesArchetype) score += 20;
    if ((p.metrics || []).length >= 3) score += 12; // hero strip has data
    if (c.confidence >= 0.7) score += 8;
    if (ctx.pages && ctx.pages <= (c.archetype === 'academic' ? 4 : 2)) score += 5;
    else if (ctx.pages) fixes.push(`Resume runs ${ctx.pages} pages — tighten toward ${c.archetype === 'academic' ? '≤3–4' : '1–2'}.`);
    if (score < 75) fixes.push('Strengthen visual hierarchy: metrics strip, clear section rules, restrained accent use.');
    return { score: clamp(score), weight: 8, notes: [`archetype ${c.archetype}, conf ${c.confidence}`], fixes };
  },

  standout(p, ctx) {
    // Rewards distinctiveness — weighted heavily only for freshers, where
    // getting noticed in a large CV stack is the whole game.
    const isFresher = ctx.classification?.isFresher;
    const weight = isFresher ? 12 : 4;
    let score = 60;
    const fixes = [];
    const hasHero = !!(p.summary?.long || p.personal_brand_statement || p.career_objective);
    const hasProjects = (p.projects || []).length > 0;
    const hasDistinct = (p.achievements || []).length > 0 || (p.awards || []).length > 0;
    if (hasHero) score += 12;
    if (hasProjects) score += 14; else if (isFresher) fixes.push('Freshers stand out via projects — add 2–3 with outcomes and tech used.');
    if (hasDistinct) score += 14;
    if (isFresher && !((p.awards || []).length || (p.achievements || []).length)) fixes.push('Add awards / hackathons / leadership to differentiate from the fresher stack.');
    return { score: clamp(score), weight, notes: [isFresher ? 'fresher — distinctiveness weighted up' : 'standard'], fixes };
  },
};

// Persona lenses: each is a weighted blend over the dimensions.
const PERSONAS = [
  { name: 'Executive Recruiter', w: { impact: 3, positioning: 2, actionVerbs: 2, humanVoice: 3, credibility: 2 } },
  { name: 'ATS Parser Bot', w: { atsCoverage: 4, completeness: 2, contactability: 2, credibility: 1 } },
  { name: 'Domain Expert', w: { impact: 3, completeness: 3, humanVoice: 2, credibility: 2 } },
  { name: 'Design Critic', w: { designFit: 4, brevity: 2, positioning: 1, standout: 2 } },
  { name: 'Hiring CEO', w: { impact: 3, standout: 2, positioning: 2, humanVoice: 3, credibility: 2 } },
];

function personaComment(name, score, dims) {
  const worst = Object.entries(dims).sort((a, b) => a[1].score - b[1].score)[0];
  const verdict = score >= 85 ? 'Would advance.' : score >= 70 ? 'Promising, needs polish.' : 'Not yet competitive.';
  return `${verdict} Weakest link: ${worst[0]} (${Math.round(worst[1].score)}).`;
}

/**
 * Convene the council.
 * @param {object} profile
 * @param {object} ctx  { classification, atsVariant, themeMatchesArchetype, pages }
 * @param {number} threshold  pass mark (default 85)
 */
function convene(profile, ctx = {}, threshold = 85) {
  const dims = {};
  for (const [key, fn] of Object.entries(DIMENSIONS)) {
    dims[key] = { key, ...fn(profile, ctx) };
  }

  const totalW = Object.values(dims).reduce((a, d) => a + d.weight, 0);
  const absolute = Object.values(dims).reduce((a, d) => a + d.score * d.weight, 0) / totalW;

  const personas = PERSONAS.map((pn) => {
    let sw = 0, wt = 0;
    for (const [k, w] of Object.entries(pn.w)) {
      if (dims[k]) { sw += dims[k].score * w; wt += w; }
    }
    const score = wt ? sw / wt : absolute;
    return { name: pn.name, score: Math.round(score), comment: personaComment(pn.name, score, dims) };
  });

  // Rank fixes by (impact = weight * shortfall).
  const fixes = [];
  for (const d of Object.values(dims)) {
    const shortfall = (100 - d.score) / 100;
    for (const f of d.fixes) fixes.push({ dimension: d.key, priority: d.weight * shortfall, fix: f });
  }
  fixes.sort((a, b) => b.priority - a.priority);

  const rounded = Math.round(absolute * 10) / 10;
  return {
    absolute: rounded,
    threshold,
    passed: rounded >= threshold,
    verdict: rounded >= threshold ? 'PASS — council approved' : 'ITERATE — below threshold',
    dimensions: Object.values(dims).map((d) => ({
      key: d.key, score: Math.round(d.score), weight: d.weight, notes: d.notes,
    })),
    personas,
    topFixes: fixes.slice(0, 8).map((f) => `[${f.dimension}] ${f.fix}`),
  };
}

/** Pretty terminal report. */
function formatReport(r) {
  const bar = (n) => {
    const filled = Math.round(n / 5);
    return '█'.repeat(filled) + '░'.repeat(20 - filled);
  };
  const lines = [];
  lines.push('');
  lines.push('  ┌─────────────────────────────────────────────────────────┐');
  lines.push(`  │  MODEL COUNCIL — Absolute Score: ${String(r.absolute).padEnd(6)} / 100  ${r.passed ? '✅ PASS' : '⏳ ITERATE'}   │`);
  lines.push('  └─────────────────────────────────────────────────────────┘');
  lines.push('');
  lines.push('  Rubric dimensions:');
  for (const d of r.dimensions) {
    lines.push(`    ${String(d.key).padEnd(15)} ${bar(d.score)} ${String(d.score).padStart(3)}  (w${d.weight})  ${d.notes.join('; ')}`);
  }
  lines.push('');
  lines.push('  Council personas:');
  for (const p of r.personas) {
    lines.push(`    ${String(p.name).padEnd(20)} ${String(p.score).padStart(3)}/100  — ${p.comment}`);
  }
  if (r.topFixes.length) {
    lines.push('');
    lines.push(`  Top fixes to reach ${r.threshold}:`);
    r.topFixes.forEach((f, i) => lines.push(`    ${i + 1}. ${f}`));
  }
  lines.push('');
  return lines.join('\n');
}

module.exports = { convene, formatReport, DIMENSIONS, PERSONAS };

// ---- CLI: node scripts/lib/council.js --profile x.json [--json] ----
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const argv = process.argv;
  const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
  const profPath = get('--profile', path.join(__dirname, '..', '..', 'profile', 'sourabh.json'));
  const p = JSON.parse(fs.readFileSync(profPath, 'utf8'));
  let classification = {};
  try { classification = require('./classify').classify(p); } catch (_) {}
  const r = convene(p, { classification, themeMatchesArchetype: true }, Number(get('--threshold', 85)));
  if (argv.includes('--json')) process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  else process.stdout.write(formatReport(r) + '\n');
  process.exit(r.passed ? 0 : 1);
}
