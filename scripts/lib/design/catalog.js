// Design catalog — 100+ named "design models", each a curated combination of a
// layout family × palette × typography × ornament set, tagged for the contexts
// it suits. Generated deterministically from the axes so it's easy to extend.

'use strict';

const { getTheme } = require('../themes');

// Ornament presets rotated across a family's entries so they differ in detail.
const ORN = [
  { title: 'rule', marker: 'dot', pill: 'rounded', metric: 'card', mono: 'rounded' },
  { title: 'bar', marker: 'ring', pill: 'soft', metric: 'boxed', mono: 'square' },
  { title: 'pilltab', marker: 'diamond', pill: 'outline', metric: 'underline', mono: 'hex' },
  { title: 'underline', marker: 'square', pill: 'soft', metric: 'card', mono: 'circle' },
  { title: 'block', marker: 'dot', pill: 'square', metric: 'plain', mono: 'square' },
];

// Palette → industry/tone affinities, for context scoring.
const PALETTE_TAGS = {
  'midnight-gold': ['finance', 'consulting', 'corporate', 'sober'],
  'royal-emerald': ['finance', 'luxury', 'corporate', 'rich'],
  'sapphire-teal': ['tech', 'consulting', 'corporate', 'modern'],
  'burgundy-rose': ['luxury', 'law', 'hospitality', 'rich'],
  'graphite-azure': ['tech', 'engineering', 'startup', 'modern'],
  'plum-coral': ['creative', 'media', 'design', 'bold'],
  'teal-sunrise': ['startup', 'creative', 'nonprofit', 'bold'],
  'academic-navy': ['academia', 'research', 'sober'],
  'slate-mono': ['ats', 'legal', 'minimal', 'sober'],
  'indigo-amber': ['tech', 'product', 'startup', 'modern'],
  'forest-copper': ['sustainability', 'nonprofit', 'academia', 'rich'],
  'charcoal-lime': ['tech', 'startup', 'gaming', 'bold'],
  'aubergine-gold': ['luxury', 'creative', 'hospitality', 'rich'],
  'ocean-coral': ['media', 'travel', 'startup', 'bold'],
  'wine-rosegold': ['luxury', 'fashion', 'hospitality', 'rich'],
  'steel-cyan': ['tech', 'engineering', 'healthcare', 'modern'],
  'noir-gold': ['luxury', 'executive', 'law', 'sober'],
  'sky-slate': ['tech', 'corporate', 'healthcare', 'modern'],
};

// Layout families: renderer + which archetypes/tones they serve + palette pool + type pool.
const FAMILIES = [
  { key: 'executive', renderer: 'executive', noun: 'Executive', archetypes: ['executive', 'general'], tones: ['formal', 'leadership', 'corporate'],
    palettes: ['midnight-gold', 'royal-emerald', 'burgundy-rose', 'graphite-azure', 'noir-gold', 'sapphire-teal', 'indigo-amber', 'steel-cyan', 'aubergine-gold', 'wine-rosegold', 'sky-slate', 'forest-copper', 'slate-mono', 'charcoal-lime'],
    types: ['sans', 'serif-head'] },
  { key: 'sidebar-right', renderer: 'universal', noun: 'Profile', archetypes: ['executive', 'general', 'technical'], tones: ['modern', 'corporate'],
    palettes: ['sapphire-teal', 'graphite-azure', 'indigo-amber', 'steel-cyan', 'sky-slate', 'midnight-gold', 'noir-gold', 'royal-emerald', 'charcoal-lime', 'ocean-coral', 'burgundy-rose', 'forest-copper'],
    types: ['sans', 'mono-accent'] },
  { key: 'single', renderer: 'universal', noun: 'Column', archetypes: ['executive', 'general', 'technical', 'academic'], tones: ['minimal', 'ats'],
    palettes: ['slate-mono', 'midnight-gold', 'graphite-azure', 'steel-cyan', 'noir-gold', 'sapphire-teal', 'sky-slate', 'academic-navy', 'indigo-amber', 'forest-copper', 'burgundy-rose', 'royal-emerald'],
    types: ['sans', 'serif-head'] },
  { key: 'header-band', renderer: 'universal', noun: 'Banner', archetypes: ['executive', 'general', 'creative', 'technical'], tones: ['bold', 'modern'],
    palettes: ['ocean-coral', 'plum-coral', 'teal-sunrise', 'indigo-amber', 'charcoal-lime', 'sapphire-teal', 'graphite-azure', 'aubergine-gold', 'royal-emerald', 'sky-slate', 'steel-cyan', 'midnight-gold'],
    types: ['sans', 'display'] },
  { key: 'academic', renderer: 'academic', noun: 'Scholar', archetypes: ['academic'], tones: ['formal', 'research'],
    palettes: ['academic-navy', 'noir-gold', 'steel-cyan', 'forest-copper', 'wine-rosegold', 'slate-mono', 'sapphire-teal', 'midnight-gold', 'burgundy-rose'],
    types: ['serif-head', 'classic-serif'] },
  { key: 'fresher', renderer: 'fresher', noun: 'Spark', archetypes: ['fresher', 'creative'], tones: ['bold', 'energetic'],
    palettes: ['teal-sunrise', 'ocean-coral', 'plum-coral', 'indigo-amber', 'charcoal-lime', 'sky-slate', 'forest-copper', 'sapphire-teal', 'aubergine-gold', 'steel-cyan'],
    types: ['sans', 'display'] },
];

function buildCatalog() {
  const out = [];
  let n = 0;
  for (const fam of FAMILIES) {
    for (const paletteKey of fam.palettes) {
      const pt = getTheme(paletteKey);
      for (const type of fam.types) {
        const orn = ORN[n % ORN.length];
        const paletteTags = PALETTE_TAGS[paletteKey] || [];
        out.push({
          id: `${fam.key}-${paletteKey}-${type}`,
          n: n + 1,
          name: `${pt.label} ${fam.noun}`,
          family: fam.key,
          renderer: fam.renderer,
          theme: paletteKey,
          paletteLabel: pt.label,
          type,
          ornaments: orn,
          tags: {
            archetypes: fam.archetypes,
            tones: fam.tones.concat(paletteTags.filter((t) => ['sober', 'rich', 'bold', 'modern', 'minimal'].includes(t))),
            industries: paletteTags.filter((t) => !['sober', 'rich', 'bold', 'modern', 'minimal'].includes(t)),
          },
        });
        n++;
      }
    }
  }
  return out;
}

const CATALOG = buildCatalog();

module.exports = { CATALOG, FAMILIES, PALETTE_TAGS, ORN };
