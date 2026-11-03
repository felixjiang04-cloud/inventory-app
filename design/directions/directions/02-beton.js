// 02 Béton: restrained brutalism. One look-book direction: its palette, fonts,
// sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 2,
  id: 'beton',
  name: 'Béton',
  family: 'Grid and system',
  dark: false,
  lang: 'en',
  line: 'Honest structure: 2 px black frames, mono labels, nothing decorative.',
  idea:
    'Treats the screen like poured concrete: the structure is the decoration. ' +
    'Everything you can touch has a 2 px black frame, labels are set in a monospaced face, ' +
    'links are underlined and buttons are unmistakably buttons.',
  signature: 'Two-pixel black frames on everything you can touch, and uppercase mono labels.',
  fonts: [
    {
      family: 'IBM Plex Sans',
      role: 'text and headings',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/IBM+Plex+Sans',
    },
    {
      family: 'IBM Plex Mono',
      role: 'labels, dates and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/IBM+Plex+Mono',
    },
  ],
  gf: ['family=IBM+Plex+Sans:wght@400;600;700', 'family=IBM+Plex+Mono:wght@400;500;600'],
  inspiration: [
    {
      label: 'Guidelines for Brutalist Web Design',
      url: 'https://brutalist-web.design/',
      note: 'raw content true to its construction; links underlined, buttons look like buttons',
    },
    {
      label: 'Are.na',
      url: 'https://www.are.na/',
      note: 'plain text, plain lists, no ornament',
    },
    {
      label: 'Brutalist architecture (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Brutalist_architecture',
      note: 'béton brut: the material shown as it is',
    },
  ],
  tokens: {
    '--color-bg': '#e7e4dd',
    '--color-surface': '#fbfaf8',
    '--color-sunken': '#efede8',
    '--color-text': '#111110',
    '--color-text-muted': '#4d4a45',
    '--color-border': '#111110',
    '--color-border-strong': '#111110',
    '--color-focus': '#2b59c3',
    '--color-accent': '#111110',
    '--color-accent-hover': '#3a3936',
    '--color-accent-soft': '#dcd8cf',
    '--color-on-accent': '#fbfaf8',
    '--color-ok': '#1a6634',
    '--color-ok-soft': '#e3efe5',
    '--color-warn': '#774700',
    '--color-warn-soft': '#f9eccf',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#9e2318',
    '--color-danger-soft': '#f8e6e3',
    '--font-body':
      "'IBM Plex Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-num':
      "'IBM Plex Mono', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', ui-monospace, monospace",
    '--weight-heading': '700',
    '--radius': '0px',
    '--rule': '2px',
  },
  tweaks: `
h2 {
  font-family: var(--font-num);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

a {
  text-decoration-thickness: 2px;
}

.btn-primary {
  font-family: var(--font-num);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.btn-quiet {
  text-decoration: underline;
  text-decoration-thickness: 2px;
}

.list-row-meta {
  font-family: var(--font-num);
  font-size: 0.8125rem;
}

.empty-state {
  border: 2px dashed var(--color-text);
  color: var(--color-text);
}

.mainnav a {
  font-family: var(--font-num);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.mainnav a.active {
  background: var(--color-accent);
  color: var(--color-on-accent);
  box-shadow: none;
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-accent);
  }
}
`,
})
