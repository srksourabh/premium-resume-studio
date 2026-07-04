// Ornament axis — the small visual details that change a resume's character:
// section-title treatment, list/timeline markers, skill-pill shape, metric-card
// style, and monogram shape. Each is a class on the sheet root; ornamentCSS()
// (added once to the base stylesheet) holds the variant rules.

'use strict';

const OPTIONS = {
  title: ['rule', 'bar', 'pilltab', 'underline', 'block'],
  marker: ['dot', 'ring', 'square', 'diamond'],
  pill: ['rounded', 'soft', 'outline', 'square'],
  metric: ['card', 'boxed', 'underline', 'plain'],
  mono: ['rounded', 'circle', 'square', 'hex'],
};

const DEFAULTS = { title: 'rule', marker: 'dot', pill: 'rounded', metric: 'card', mono: 'rounded' };

function normalize(orn = {}) {
  const o = { ...DEFAULTS, ...orn };
  for (const k of Object.keys(DEFAULTS)) if (!OPTIONS[k].includes(o[k])) o[k] = DEFAULTS[k];
  return o;
}

/** Root class string for a set of ornaments, e.g. "t-bar m-ring p-outline mtr-boxed mono-hex". */
function ornamentClasses(orn) {
  const o = normalize(orn);
  return `t-${o.title} m-${o.marker} p-${o.pill} mtr-${o.metric} mono-${o.mono}`;
}

/** All ornament variant rules — appended to the base stylesheet once. */
function ornamentCSS() {
  return `
  /* ---- section-title treatments ---- */
  .t-bar .sec-title{ border-bottom:0; padding:0 0 0 3.5mm; border-left:3px solid var(--accent); }
  .t-pilltab .sec-title{ border-bottom:0; display:inline-flex; background:rgba(var(--accent-rgb),0.12); color:var(--accent-deep); padding:1.4mm 3.5mm; border-radius:20px; }
  .t-pilltab .sec-title .ic{ color:var(--accent-deep); }
  .t-underline .sec-title{ border-bottom:0; }
  .t-underline .sec-title::after{ content:''; display:block; }
  .t-underline .sec-title{ position:relative; padding-bottom:2mm; }
  .t-underline .sec-title{ background:linear-gradient(var(--accent),var(--accent)) left bottom / 14mm 2.4px no-repeat; }
  .t-block .sec-title{ border-bottom:0; background:var(--accent-deep); color:var(--accent-text); padding:1.6mm 3.5mm; border-radius:4px; }
  .t-block .sec-title .ic, .t-block .sec-title .tick{ color:var(--accent-text); }

  /* ---- markers (timeline nodes + bullet dots) ---- */
  .m-ring .venture::before, .m-ring .tl::before, .m-ring .xp::before{ background:var(--bg); border:2px solid var(--accent); }
  .m-ring .ach li::before, .m-ring .tl-dot{ background:var(--bg); border:1.6px solid var(--accent); }
  .m-square .venture::before, .m-square .tl::before, .m-square .xp::before{ border-radius:1px; }
  .m-square .ach li::before{ border-radius:0; }
  .m-diamond .venture::before, .m-diamond .tl::before, .m-diamond .xp::before{ border-radius:1px; transform:rotate(45deg); }
  .m-diamond .ach li::before{ border-radius:0; transform:rotate(45deg); }

  /* ---- skill-pill shapes ---- */
  .p-soft .pill{ border-color:transparent; background:rgba(var(--accent-rgb),0.13); }
  .p-outline .pill{ background:transparent; border:1px solid rgba(var(--accent-rgb),0.5); color:var(--accent-deep); }
  .p-square .pill{ border-radius:3px; }
  .aside.p-soft .pill, .p-soft .aside .pill{ background:rgba(255,255,255,0.1); }

  /* ---- metric-card styles ---- */
  .mtr-boxed .metric{ border:1px solid var(--hairline); border-bottom:2.5px solid var(--accent-deep); background:var(--bg); }
  .mtr-underline .metric{ background:transparent; border:0; border-bottom:2.5px solid var(--accent); border-radius:0; padding-left:0; }
  .mtr-plain .metric{ background:transparent; border:0; padding:1mm 0; }
  .mtr-plain .metric .n{ font-size:15pt; }

  /* ---- monogram shapes ---- */
  .mono-circle .monogram{ border-radius:50%; }
  .mono-square .monogram{ border-radius:6px; }
  .mono-hex .monogram{ border-radius:0; clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%); }
  `;
}

module.exports = { OPTIONS, DEFAULTS, normalize, ornamentClasses, ornamentCSS };
