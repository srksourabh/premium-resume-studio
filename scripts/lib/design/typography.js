// Typography axis — font pairings emitted as CSS custom properties so any
// template restyles just by switching the `type` key. Web-safe stacks only
// (deterministic, offline).

'use strict';

const SANS = "'Inter','Segoe UI','Helvetica Neue',Arial,'Liberation Sans',system-ui,sans-serif";
const SERIF = "Georgia,'Liberation Serif','Times New Roman',serif";
const MONO = "'SFMono-Regular','Liberation Mono','DejaVu Sans Mono',Consolas,monospace";

const TYPES = {
  // Clean modern — sans everywhere, uppercase tracked headings.
  sans: { label: 'Clean Sans', head: SANS, body: SANS, mono: MONO, headCase: 'uppercase', headSpacing: '1.3px', headWeight: 800 },
  // Editorial — serif section headings over a sans body.
  'serif-head': { label: 'Serif Headings', head: SERIF, body: SANS, mono: MONO, headCase: 'none', headSpacing: '0', headWeight: 700 },
  // Technical — mono labels/dates, sans everything else.
  'mono-accent': { label: 'Mono Accent', head: SANS, body: SANS, mono: MONO, headCase: 'uppercase', headSpacing: '2px', headWeight: 700, monoLabels: true },
  // Traditional — full serif, classic CV feel.
  'classic-serif': { label: 'Classic Serif', head: SERIF, body: SERIF, mono: MONO, headCase: 'none', headSpacing: '.2px', headWeight: 700 },
  // Bold display — heavy tight sans headings (impactful).
  display: { label: 'Bold Display', head: SANS, body: SANS, mono: MONO, headCase: 'uppercase', headSpacing: '.4px', headWeight: 900 },
};

function getType(key) {
  return TYPES[key] ? { key, ...TYPES[key] } : { key: 'sans', ...TYPES.sans };
}

/** Emit type tokens on :root. */
function typeCSS(key) {
  const t = getType(key);
  return `:root{
  --font-head:${t.head}; --font-body:${t.body}; --font-mono:${t.mono};
  --head-case:${t.headCase}; --head-spacing:${t.headSpacing}; --head-weight:${t.headWeight};
}${t.monoLabels ? `
  .side-h,.metric .l,.v-head .d,.early .ed,.entry .d,.product-type,.product .t,.proj .tech span{ font-family:var(--font-mono); letter-spacing:.2px; }` : ''}`;
}

module.exports = { TYPES, getType, typeCSS };
