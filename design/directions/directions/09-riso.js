// 09 Riso: monochrome plus one spot ink. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 9,
  id: 'riso',
  name: 'Riso',
  family: 'Paper and print',
  dark: false,
  lang: 'en',
  line: 'Black and white plus one fluorescent pink, used only for the next thing to do.',
  idea:
    'Printed like a two-colour Risograph zine: everything in black on warm off-white, plus one fluorescent spot ink. ' +
    'The pink appears in one place per screen, the thing to do next, so the eye goes straight to it.',
  signature: 'A fluorescent-pink block for the main action; nothing else on the page is coloured.',
  fonts: [
    {
      family: 'Familjen Grotesk',
      role: 'everything',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Familjen+Grotesk',
    },
  ],
  gf: ['family=Familjen+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  inspiration: [
    {
      label: 'Risograph inks (SAIC Service Bureau)',
      url: 'https://sites.saic.edu/servicebureau/wp-content/uploads/sites/20/2025/03/EverythingRiso_2024.pdf',
      note: 'Fluorescent Pink, hex FF48B0 (Pantone 806 U)',
    },
    {
      label: 'teenage engineering',
      url: 'https://teenage.engineering/',
      note: 'a monochrome interface where colour is kept for one job',
    },
    {
      label: 'Familjen Grotesk',
      url: 'https://fonts.google.com/specimen/Familjen+Grotesk',
      note: 'a grotesk with a slightly hand-cut edge',
    },
  ],
  linksUseText: true,
  tokens: {
    '--color-bg': '#f6f4ef',
    '--color-surface': '#ffffff',
    '--color-sunken': '#ecebe6',
    '--color-text': '#151413',
    '--color-text-muted': '#55524c',
    '--color-border': '#d6d2ca',
    '--color-border-strong': '#84807a',
    '--color-focus': '#151413',
    '--color-accent': '#ff48b0',
    '--color-accent-hover': '#f0329f',
    '--color-accent-soft': '#ffe3f2',
    '--color-on-accent': '#151413',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e6f1e8',
    '--color-warn': '#7a4a00',
    '--color-warn-soft': '#fbf0d9',
    '--color-warn-border': '#c98a1c',
    '--color-danger': '#a2251b',
    '--color-danger-soft': '#fbe9e6',
    '--font-body':
      "'Familjen Grotesk', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--text-2xl': '2.25rem',
    '--weight-heading': '700',
    '--tracking-heading': '-0.02em',
    '--radius': '2px',
    '--brand-tile': '#151413',
    '--brand-paper': '#ffffff',
  },
  tweaks: `
/* The pink is too light for text, so links stay black with a pink underline */
a,
a:hover,
.btn-quiet,
.btn-quiet:hover {
  color: var(--color-text);
}

.mainnav a {
  color: var(--color-text-muted);
}

.btn-quiet,
.after-list a {
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-decoration-thickness: 3px;
  text-underline-offset: 0.2em;
}

.btn-primary,
.btn-primary:hover {
  color: var(--color-on-accent);
  font-weight: 700;
}

.list {
  border: 2px solid var(--color-text);
}

.empty-state {
  border: 1px solid var(--color-border-strong);
}

.topbar {
  border-bottom: 2px solid var(--color-text);
}

.mainnav {
  border-top: 2px solid var(--color-text);
}

.mainnav a.active {
  color: var(--color-text);
  box-shadow: inset 0 5px 0 var(--color-accent);
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-accent-soft);
    box-shadow: inset 5px 0 0 var(--color-accent);
  }
}
`,
})
