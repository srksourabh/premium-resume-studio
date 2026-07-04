// Design selector — picks a design model from the catalog based on the person's
// context (archetype, seniority, industry). Default is best-fit and reproducible;
// --design/--variant/--random override.

'use strict';

const { CATALOG } = require('./catalog');

const INDUSTRY = {
  finance: /\b(finance|financial|bank|investment|fintech|accounting|audit|wealth|trading|equity|capital markets)\b/i,
  tech: /\b(software|develop|programmer|technology|it services|cloud|\bai\b|machine learning|data|devops|saas|platform|cyber|system integration)\b/i,
  consulting: /\b(consult|strategy|advisory)\b/i,
  creative: /\b(design|creative|\bart\b|film|photograph|brand|content|copywriter|theatre|music|animation)\b/i,
  media: /\b(media|journalis|editor|broadcast|video|production|storytelling)\b/i,
  healthcare: /\b(health|medical|clinical|pharma|hospital|nurse|doctor|biotech)\b/i,
  academia: /\b(research|professor|university|ph\.?d|academic|scholar|postdoc|lecturer)\b/i,
  law: /\b(\blaw\b|legal|attorney|counsel|litigation|paralegal)\b/i,
  luxury: /\b(luxury|fashion|hospitality|hotel|premium|couture)\b/i,
  nonprofit: /\b(non-?profit|\bngo\b|social impact|foundation|charity)\b/i,
  startup: /\b(founder|start-?up|co-?founder|venture)\b/i,
  engineering: /\b(mechanical|civil|electrical|manufactur|hardware)\b/i,
  sustainability: /\b(sustainab|climate|environment|renewable)\b/i,
};

function detectIndustries(p) {
  const blob = JSON.stringify({
    h: p.identity && p.identity.headline, s: p.summary,
    r: (p.current_roles || []).map((r) => `${r.title} ${r.company} ${r.industry}`),
    o: p.career_objective,
  }).toLowerCase();
  return Object.keys(INDUSTRY).filter((k) => INDUSTRY[k].test(blob));
}

function scoreEntry(entry, ctx) {
  let s = 1;
  const inds = ctx.industries || [];
  const overlap = (entry.tags.industries || []).filter((t) => inds.includes(t)).length;
  s += overlap * 4;

  const tones = entry.tags.tones || [];
  const has = (t) => tones.includes(t);
  const sen = ctx.seniority;
  if (sen === 'executive' || sen === 'senior') {
    if (has('formal')) s += 2; if (has('leadership')) s += 2; if (has('sober')) s += 2; if (has('rich')) s += 1;
    if (has('bold')) s -= 2; if (has('energetic')) s -= 2;
  } else if (ctx.isFresher || sen === 'junior') {
    if (has('bold')) s += 2; if (has('modern')) s += 2; if (has('energetic')) s += 2;
    if (has('formal')) s -= 1;
  } else { // mid
    if (has('modern')) s += 1; if (has('corporate')) s += 1;
  }
  // Prefer the flagship layout for the primary archetype (small nudge).
  if (ctx.archetype === 'executive' && entry.family === 'executive') s += 1.5;
  if (ctx.archetype === 'academic' && entry.family === 'academic') s += 2;
  if (ctx.isFresher && entry.family === 'fresher') s += 2;
  return s;
}

function fittingList(classification, profile) {
  const archetype = classification.archetype || 'general';
  const ctx = {
    archetype, seniority: classification.seniority, isFresher: classification.isFresher,
    industries: detectIndustries(profile || {}),
  };
  let pool = CATALOG.filter((e) => (e.tags.archetypes || []).includes(archetype));
  if (!pool.length) pool = CATALOG.slice();
  const scored = pool.map((e) => ({ e, s: scoreEntry(e, ctx) }));
  // Deterministic: score desc, then catalog order (id) asc.
  scored.sort((a, b) => (b.s - a.s) || (a.e.n - b.e.n));
  return { ctx, list: scored.map((x) => x.e) };
}

function findById(ref) {
  const r = String(ref).toLowerCase();
  return CATALOG.find((e) => e.id.toLowerCase() === r || e.name.toLowerCase() === r || String(e.n) === r) || null;
}

/**
 * @param classification  from classify()
 * @param profile         the profile object
 * @param opts { design, variant, random }
 * @returns { design, reason, fitting, total }
 */
function selectDesign(classification, profile, opts = {}) {
  if (opts.design) {
    const hit = findById(opts.design);
    if (hit) return { design: hit, reason: `forced via --design ${opts.design}`, fitting: 1, total: CATALOG.length };
  }
  const { ctx, list } = fittingList(classification, profile);
  let idx = 0;
  let reason = `best fit for ${ctx.archetype}/${ctx.seniority}` + (ctx.industries.length ? ` · industry: ${ctx.industries.slice(0, 3).join(', ')}` : '');
  if (opts.random) {
    idx = Math.floor(Math.random() * list.length);
    reason = `random on-brand pick (${idx + 1}/${list.length} fitting)`;
  } else if (opts.variant && opts.variant > 1) {
    idx = (opts.variant - 1) % list.length;
    reason = `variant ${opts.variant} of ${list.length} fitting designs`;
  }
  return { design: list[idx], reason, fitting: list.length, total: CATALOG.length };
}

function listDesigns() {
  return CATALOG.map((e) => ({ n: e.n, id: e.id, name: e.name, family: e.family, palette: e.theme, type: e.type }));
}

module.exports = { selectDesign, listDesigns, fittingList, detectIndustries };
