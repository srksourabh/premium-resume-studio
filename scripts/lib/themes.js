// Design-token themes for Premium Resume Studio.
// Each theme is a self-contained palette. "Colorful but sober" means deep,
// saturated accents on clean backgrounds — rich, never neon.
//
// Templates consume these via CSS custom properties emitted by themeCSS().

'use strict';

/**
 * @typedef {Object} Theme
 * @property {string} key
 * @property {string} label
 * @property {string} ink        Primary body text
 * @property {string} inkSoft    Secondary text
 * @property {string} bg         Page background
 * @property {string} surface    Card / tint background
 * @property {string} hairline   Dividers
 * @property {string} sidebarFrom, sidebarVia, sidebarTo  Sidebar gradient stops
 * @property {string} sidebarInk, sidebarMuted            Text on the sidebar
 * @property {string} accent     Primary accent
 * @property {string} accentRGB  "r,g,b" for rgba() tints
 * @property {string} accentDeep Darker accent (borders, secondary)
 * @property {string} accentText Text color to sit on the accent fill
 * @property {string} heroInk    Accent-tinted text on the dark sidebar
 */

const THEMES = {
  // Executive default — deep navy + warm amber/gold.
  'midnight-gold': {
    label: 'Midnight Gold',
    ink: '#16202f', inkSoft: '#59647a', bg: '#ffffff', surface: '#f5f7fb', hairline: '#e2e8f2',
    sidebarFrom: '#0b1e39', sidebarVia: '#12365f', sidebarTo: '#1f4f8a',
    sidebarInk: '#eef3fb', sidebarMuted: '#b9cae2',
    accent: '#f0b34e', accentRGB: '240,179,78', accentDeep: '#cf8a34', accentText: '#0b1e39',
    heroInk: '#fbe2b4',
  },
  // Executive alt — deep emerald + antique gold.
  'royal-emerald': {
    label: 'Royal Emerald',
    ink: '#132019', inkSoft: '#54655c', bg: '#ffffff', surface: '#f3f7f4', hairline: '#dde8e1',
    sidebarFrom: '#08301f', sidebarVia: '#0f4a30', sidebarTo: '#1c6a48',
    sidebarInk: '#eefaf3', sidebarMuted: '#b6d6c4',
    accent: '#e5b769', accentRGB: '229,183,105', accentDeep: '#bd8f3f', accentText: '#08301f',
    heroInk: '#f6e3bd',
  },
  // Corporate blue — sapphire + teal, crisp and modern.
  'sapphire-teal': {
    label: 'Sapphire Teal',
    ink: '#111c2b', inkSoft: '#556174', bg: '#ffffff', surface: '#f2f6fb', hairline: '#dde6f1',
    sidebarFrom: '#0a2540', sidebarVia: '#0e3a63', sidebarTo: '#155e75',
    sidebarInk: '#eef6fb', sidebarMuted: '#accbdf',
    accent: '#2dd4bf', accentRGB: '45,212,191', accentDeep: '#0f9d8f', accentText: '#052e2b',
    heroInk: '#a7f3e6',
  },
  // Distinguished — burgundy + rose gold.
  'burgundy-rose': {
    label: 'Burgundy Rose',
    ink: '#241318', inkSoft: '#6b5459', bg: '#ffffff', surface: '#faf3f4', hairline: '#ecdcdf',
    sidebarFrom: '#3a0f1c', sidebarVia: '#5c1728', sidebarTo: '#822338',
    sidebarInk: '#fdf0f2', sidebarMuted: '#e4b9c3',
    accent: '#dda15e', accentRGB: '221,161,94', accentDeep: '#b87b3c', accentText: '#3a0f1c',
    heroInk: '#f4d9bf',
  },
  // Technical — graphite + electric azure.
  'graphite-azure': {
    label: 'Graphite Azure',
    ink: '#151922', inkSoft: '#5b6474', bg: '#ffffff', surface: '#f4f6fa', hairline: '#e0e5ee',
    sidebarFrom: '#12151c', sidebarVia: '#1b2430', sidebarTo: '#28384a',
    sidebarInk: '#eef2f8', sidebarMuted: '#aeb9c9',
    accent: '#38bdf8', accentRGB: '56,189,248', accentDeep: '#0ea5e9', accentText: '#082032',
    heroInk: '#bae6fd',
  },
  // Creative / fresher — deep plum + warm coral.
  'plum-coral': {
    label: 'Plum Coral',
    ink: '#1e1524', inkSoft: '#62596c', bg: '#ffffff', surface: '#f7f3fa', hairline: '#e8ddef',
    sidebarFrom: '#2a1244', sidebarVia: '#421d6b', sidebarTo: '#5b2a8c',
    sidebarInk: '#f6effc', sidebarMuted: '#cdb9e4',
    accent: '#fb7185', accentRGB: '251,113,133', accentDeep: '#e11d48', accentText: '#2a1244',
    heroInk: '#fecdd3',
  },
  // Fresher — teal + warm sunrise, energetic yet professional.
  'teal-sunrise': {
    label: 'Teal Sunrise',
    ink: '#0f1f22', inkSoft: '#4d6167', bg: '#ffffff', surface: '#eff8f7', hairline: '#d5e8e6',
    sidebarFrom: '#0c3b3a', sidebarVia: '#0f5a57', sidebarTo: '#13807a',
    sidebarInk: '#effaf8', sidebarMuted: '#a8d8d2',
    accent: '#fb923c', accentRGB: '251,146,60', accentDeep: '#ea7317', accentText: '#0c3b3a',
    heroInk: '#fed7aa',
  },
  // Academic — restrained navy + crimson, serif-friendly.
  'academic-navy': {
    label: 'Academic Navy',
    ink: '#1a2230', inkSoft: '#59616f', bg: '#ffffff', surface: '#f4f6f9', hairline: '#dfe4ec',
    sidebarFrom: '#152238', sidebarVia: '#1d3355', sidebarTo: '#274a76',
    sidebarInk: '#eef2f8', sidebarMuted: '#b4c2d6',
    accent: '#9b1c2e', accentRGB: '155,28,46', accentDeep: '#7a1523', accentText: '#ffffff',
    heroInk: '#e7c9cd',
  },
  // ATS-safe monochrome — for the plain-text-adjacent print variant.
  'slate-mono': {
    label: 'Slate Mono',
    ink: '#1b1f27', inkSoft: '#4a5261', bg: '#ffffff', surface: '#f3f4f6', hairline: '#d9dde4',
    sidebarFrom: '#1b1f27', sidebarVia: '#242a34', sidebarTo: '#2f3742',
    sidebarInk: '#f2f3f5', sidebarMuted: '#b6bcc6',
    accent: '#374151', accentRGB: '55,65,81', accentDeep: '#1f2937', accentText: '#ffffff',
    heroInk: '#d1d5db',
  },
  'indigo-amber': {
    label: 'Indigo Amber',
    ink: '#171a2e', inkSoft: '#575d78', bg: '#ffffff', surface: '#f3f4fb', hairline: '#e0e2f0',
    sidebarFrom: '#1e1b4b', sidebarVia: '#312e81', sidebarTo: '#4338ca',
    sidebarInk: '#eef0fc', sidebarMuted: '#bcc0ec',
    accent: '#f59e0b', accentRGB: '245,158,11', accentDeep: '#d97706', accentText: '#1e1b4b',
    heroInk: '#fde3b3',
  },
  'forest-copper': {
    label: 'Forest Copper',
    ink: '#14201a', inkSoft: '#516158', bg: '#ffffff', surface: '#f2f6f3', hairline: '#dbe7e0',
    sidebarFrom: '#14312a', sidebarVia: '#1c4a3f', sidebarTo: '#276b57',
    sidebarInk: '#edf7f2', sidebarMuted: '#afd0c2',
    accent: '#c2703d', accentRGB: '194,112,61', accentDeep: '#9c5628', accentText: '#14312a',
    heroInk: '#f0cbb0',
  },
  'charcoal-lime': {
    label: 'Charcoal Lime',
    ink: '#14171c', inkSoft: '#565d69', bg: '#ffffff', surface: '#f3f5f7', hairline: '#dfe3e9',
    sidebarFrom: '#111418', sidebarVia: '#1c2128', sidebarTo: '#2b333d',
    sidebarInk: '#eef1f5', sidebarMuted: '#aab3bf',
    accent: '#84cc16', accentRGB: '132,204,22', accentDeep: '#5c9010', accentText: '#111418',
    heroInk: '#d5f0a8',
  },
  'aubergine-gold': {
    label: 'Aubergine Gold',
    ink: '#201625', inkSoft: '#63586b', bg: '#ffffff', surface: '#f7f3f8', hairline: '#e8deeb',
    sidebarFrom: '#2e1035', sidebarVia: '#4a1a52', sidebarTo: '#6b2a74',
    sidebarInk: '#f6eff8', sidebarMuted: '#d1b8d8',
    accent: '#d4a017', accentRGB: '212,160,23', accentDeep: '#a87c0f', accentText: '#2e1035',
    heroInk: '#f2ddad',
  },
  'ocean-coral': {
    label: 'Ocean Coral',
    ink: '#0f1c26', inkSoft: '#4c6070', bg: '#ffffff', surface: '#eef5f9', hairline: '#d6e4ee',
    sidebarFrom: '#0b2c40', sidebarVia: '#0f4763', sidebarTo: '#14688f',
    sidebarInk: '#eef7fc', sidebarMuted: '#a9cbe0',
    accent: '#ff6b6b', accentRGB: '255,107,107', accentDeep: '#e5484d', accentText: '#0b2c40',
    heroInk: '#ffc9c9',
  },
  'wine-rosegold': {
    label: 'Wine Rose Gold',
    ink: '#221419', inkSoft: '#6a5459', bg: '#ffffff', surface: '#f9f2f4', hairline: '#ecdadf',
    sidebarFrom: '#4a1020', sidebarVia: '#6d1a30', sidebarTo: '#8f2444',
    sidebarInk: '#fceff2', sidebarMuted: '#e0b4c0',
    accent: '#e8b4a0', accentRGB: '232,180,160', accentDeep: '#c88a70', accentText: '#4a1020',
    heroInk: '#f6dcd2',
  },
  'steel-cyan': {
    label: 'Steel Cyan',
    ink: '#131a20', inkSoft: '#546069', bg: '#ffffff', surface: '#f1f5f7', hairline: '#dde5ea',
    sidebarFrom: '#1a2730', sidebarVia: '#243943', sidebarTo: '#324f5c',
    sidebarInk: '#eef4f7', sidebarMuted: '#aec1cc',
    accent: '#06b6d4', accentRGB: '6,182,212', accentDeep: '#0891b2', accentText: '#08313a',
    heroInk: '#a5eaf4',
  },
  'noir-gold': {
    label: 'Noir Gold',
    ink: '#17161a', inkSoft: '#5b5960', bg: '#ffffff', surface: '#f4f3f5', hairline: '#e2e0e4',
    sidebarFrom: '#100f12', sidebarVia: '#1c1a20', sidebarTo: '#2a272f',
    sidebarInk: '#f2f0f4', sidebarMuted: '#b3afb9',
    accent: '#c9a227', accentRGB: '201,162,39', accentDeep: '#9c7c15', accentText: '#100f12',
    heroInk: '#eedda9',
  },
  'sky-slate': {
    label: 'Sky Slate',
    ink: '#141a24', inkSoft: '#525d70', bg: '#ffffff', surface: '#f1f4f9', hairline: '#dde3ee',
    sidebarFrom: '#1e293b', sidebarVia: '#334155', sidebarTo: '#475569',
    sidebarInk: '#eff3f9', sidebarMuted: '#b0bccd',
    accent: '#0ea5e9', accentRGB: '14,165,233', accentDeep: '#0284c7', accentText: '#0b2740',
    heroInk: '#bae0f7',
  },
};

// Default theme per archetype (overridable via --theme).
const ARCHETYPE_THEME = {
  executive: 'midnight-gold',
  academic: 'academic-navy',
  fresher: 'teal-sunrise',
  technical: 'graphite-azure',
  general: 'sapphire-teal',
  creative: 'plum-coral',
};

function getTheme(key) {
  const t = THEMES[key];
  if (!t) return { key: 'midnight-gold', ...THEMES['midnight-gold'] };
  return { key, ...t };
}

function themeForArchetype(archetype) {
  return ARCHETYPE_THEME[archetype] || 'midnight-gold';
}

/** Emit the theme as CSS custom properties on :root. */
function themeCSS(theme) {
  const t = typeof theme === 'string' ? getTheme(theme) : theme;
  return `:root{
  --ink:${t.ink}; --ink-soft:${t.inkSoft}; --bg:${t.bg}; --surface:${t.surface}; --hairline:${t.hairline};
  --side-from:${t.sidebarFrom}; --side-via:${t.sidebarVia}; --side-to:${t.sidebarTo};
  --side-ink:${t.sidebarInk}; --side-muted:${t.sidebarMuted};
  --accent:${t.accent}; --accent-rgb:${t.accentRGB}; --accent-deep:${t.accentDeep};
  --accent-text:${t.accentText}; --hero-ink:${t.heroInk};
}`;
}

module.exports = { THEMES, ARCHETYPE_THEME, getTheme, themeForArchetype, themeCSS };
