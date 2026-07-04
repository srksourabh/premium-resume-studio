// Shared components + base CSS for all resume templates.
// Templates compose these; the theme supplies colors via CSS variables.

'use strict';

const { esc, cleanUrl } = require('../helpers');
const { themeCSS } = require('../themes');
const { typeCSS } = require('../design/typography');
const { ornamentClasses, ornamentCSS } = require('../design/ornaments');

// --- Inline SVG icons (currentColor, 1em box) — print-safe, no network. ---
const ICONS = {
  mail: '<path d="M4 6h16v12H4z" fill="none"/><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5zM5 7l7 5 7-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  phone: '<path d="M6.6 3h3l1.2 4-2 1.4a12 12 0 0 0 5 5l1.4-2 4 1.2v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5a2 2 0 0 1 2.1-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  link: '<path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 11a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 18l1.2-1.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/><path d="M7 10v7M7 7.2v.1M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>',
  globe: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor"/>',
  spark: '<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z" fill="currentColor"/>',
  cap: '<path d="M12 4l9 4-9 4-9-4z" fill="currentColor"/><path d="M6 10v4c0 1.6 2.7 3 6 3s6-1.4 6-3v-4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12h18" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  award: '<circle cx="12" cy="9" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 13l-1.5 7L12 18l4.5 2L15 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  flask: '<path d="M10 3h4M11 3v6l-5 8a2 2 0 0 0 1.7 3h8.6a2 2 0 0 0 1.7-3l-5-8V3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  heart: '<path d="M12 20s-7-4.6-7-9.6A3.9 3.9 0 0 1 12 7a3.9 3.9 0 0 1 7 3.4c0 5-7 9.6-7 9.6z" fill="currentColor"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  rocket: '<path d="M12 3c3 1 5 4 5 8l-2 2-2-1-2 2-1-2-2 1-2-2c0-4 2-7 5-8z" fill="currentColor"/><path d="M9 17l-2 4 4-2M15 17l2 4-4-2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
};

function icon(name, size = '1em') {
  const body = ICONS[name] || ICONS.spark;
  return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

const pill = (t) => `<span class="pill">${esc(t)}</span>`;
const pills = (arr, max = 99) => `<div class="pills">${(arr || []).slice(0, max).map(pill).join('')}</div>`;

/** Base CSS shared by every template. Colors come from CSS variables. */
function baseCSS() {
  return `
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    font-family:var(--font-body,'Inter','Segoe UI','Helvetica Neue',Arial,'Liberation Sans',system-ui,sans-serif);
    color:var(--ink); background:var(--bg);
    -webkit-font-smoothing:antialiased; font-size:9.7pt; line-height:1.38;
  }
  @page{ size:A4; margin:0; }
  .sheet{ width:210mm; min-height:290mm; background:var(--bg); position:relative; }
  h1,h2,h3,h4{ margin:0; }
  ul{ margin:0; }
  a{ color:inherit; text-decoration:none; }
  .ic{ vertical-align:-0.14em; flex-shrink:0; }
  .pills{ display:flex; flex-wrap:wrap; gap:1.4mm; }
  .pill{
    background:rgba(var(--accent-rgb),0.10); color:var(--accent-deep);
    border:1px solid rgba(var(--accent-rgb),0.28);
    padding:1mm 2.6mm; border-radius:12px; font-size:7.8pt; line-height:1.25; white-space:nowrap;
  }
  .accent{ color:var(--accent-deep); }
  .muted{ color:var(--ink-soft); }
  /* Content flows freely across pages so the auto-fitter can fill each page
     exactly (no break-inside shifts → continuous layout == printed layout).
     Only a section title is kept with its first rows (no orphan title at a
     page bottom); the fitter's slack absorbs that small shift. */
  .sec-title{ break-after:avoid; }
  /* Sidebar shell (used by two-column templates) */
  .aside{
    background:linear-gradient(160deg,var(--side-from) 0%,var(--side-via) 55%,var(--side-to) 100%);
    color:var(--side-ink); position:relative; overflow:hidden;
  }
  .aside::after{
    content:''; position:absolute; inset:0; pointer-events:none;
    background-image:
      radial-gradient(circle at 85% 8%, rgba(var(--accent-rgb),0.16), transparent 45%),
      linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
    background-size:auto, 7px 7px, 7px 7px;
  }
  .aside > *{ position:relative; z-index:1; }
  .monogram{
    width:60px;height:60px;border-radius:16px;
    background:linear-gradient(135deg,var(--accent) 0%,var(--accent-deep) 100%);
    color:var(--accent-text); display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:20pt;letter-spacing:.5px;
    box-shadow:0 6px 20px rgba(var(--accent-rgb),0.35);
  }
  .side-h{
    font-size:7.5pt;text-transform:uppercase;letter-spacing:1.7px;color:var(--accent);
    font-weight:700;margin:0 0 2.5mm 0;padding-bottom:1.4mm;display:flex;align-items:center;gap:1.6mm;
    border-bottom:1px solid rgba(var(--accent-rgb),0.42);
  }
  .side-sec{ margin-bottom:4.4mm; }
  .contact-row{ display:flex; align-items:center; gap:2.4mm; font-size:8.6pt; margin-bottom:1.8mm; color:var(--side-ink); }
  .contact-row .ic{ color:var(--accent); }
  .side-line{ font-size:8.7pt; margin-bottom:1.4mm; color:var(--side-ink); }
  .side-line strong{ color:#fff; font-weight:700; }
  .aside .pill{ background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); color:var(--side-ink); }
  /* Main column primitives */
  .sec-title{
    font-size:11pt;color:var(--ink);
    font-family:var(--font-head,'Inter',sans-serif);
    text-transform:var(--head-case,uppercase);letter-spacing:var(--head-spacing,1.3px);font-weight:var(--head-weight,800);
    margin:0 0 3mm 0;padding-bottom:1.4mm;border-bottom:2px solid var(--hairline);
    display:flex;align-items:center;gap:2mm;
  }
  .sec-title .ic{ color:var(--accent-deep); }
  .sec-title .tick{ color:var(--accent-deep); font-weight:900; }
  .lede{
    font-size:10.2pt;line-height:1.55;color:var(--ink);
    background:linear-gradient(90deg,rgba(var(--accent-rgb),0.12) 0%,rgba(var(--accent-rgb),0) 100%);
    border-left:3px solid var(--accent);padding:3.5mm 4.5mm;border-radius:0 5px 5px 0;
  }
  .metrics{ display:grid; grid-template-columns:repeat(var(--mcols,4),1fr); gap:2.6mm; }
  .metric{ background:var(--surface); border-radius:6px; padding:2.8mm 3mm; border-bottom:2.5px solid var(--accent-deep); }
  .metric .n{ font-size:13pt; font-weight:800; color:var(--ink); line-height:1.05; letter-spacing:-.4px; word-break:keep-all; }
  .metric .l{ font-size:7pt; color:var(--ink-soft); text-transform:uppercase; letter-spacing:.4px; margin-top:1.4mm; line-height:1.25; }
  ${ornamentCSS()}
  `;
}

/**
 * Assemble a full HTML document.
 * Accepts either `design` ({ theme, type, ornaments, rootClass }) — the new
 * design-catalog path — or a bare `theme` for back-compat.
 */
function docShell({ title, theme, css, body, extraHead = '', design }) {
  const paletteKey = design ? design.theme : theme;
  const typeKey = design ? design.type : 'sans';
  const rootCls = [
    design ? ornamentClasses(design.ornaments) : '',
    design && design.rootClass ? design.rootClass : '',
    typeKey ? `type-${typeKey}` : '',
  ].filter(Boolean).join(' ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="hz:canvas-width" content="794">
<title>${esc(title)}</title>
<style>${themeCSS(paletteKey)}${typeCSS(typeKey)}${baseCSS()}${css}</style>
${extraHead}
</head>
<body class="${rootCls}">${body}</body>
</html>`;
}

/** Contact block with icons — picks the right icon per field. */
function contactBlock(id, { onDark = true } = {}) {
  const rows = [];
  const add = (ic, val, href) => {
    if (!val) return;
    rows.push(`<div class="contact-row">${icon(ic)}<span>${esc(val)}</span></div>`);
  };
  add('pin', id.location);
  add('mail', id.email);
  add('phone', id.phone);
  if (id.linkedin) add('linkedin', cleanUrl(id.linkedin));
  if (id.website) add('globe', cleanUrl(id.website));
  if (id.portfolio) add('link', cleanUrl(id.portfolio));
  if (id.github) add('code', cleanUrl(id.github));
  return rows.join('');
}

module.exports = { icon, pill, pills, baseCSS, docShell, contactBlock, ICONS };
