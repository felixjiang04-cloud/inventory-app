// 12 Pâtisserie: the pastry counter. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 12,
  id: 'patisserie',
  name: 'Pâtisserie',
  family: 'Kitchen',
  dark: false,
  lang: 'en',
  line: 'Pastry-counter calm: pale rose, cocoa ink, fine double lines.',
  idea:
    'The calm of a pastry counter: pale rose surfaces, cocoa brown instead of black, and a refined display serif for titles. ' +
    'Soft, but the figures stay large and the main button is a solid cocoa block.',
  signature: 'Cocoa on rose instead of black on white, with a fine double line under each title.',
  fonts: [
    {
      family: 'Gilda Display',
      role: 'titles',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Gilda+Display',
    },
    {
      family: 'Nunito Sans',
      role: 'text and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Nunito+Sans',
    },
  ],
  gf: ['family=Gilda+Display', 'family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;1,6..12,400'],
  inspiration: [
    {
      label: 'Minimal Gallery, food & drink',
      url: 'https://minimal.gallery/tag/food-drink/',
      note: 'bakeries and food brands that pair soft colour with strict layout',
    },
    {
      label: 'Kinfolk',
      url: 'https://www.kinfolk.com/',
      note: 'muted colour and a refined serif, with lots of air',
    },
    {
      label: 'Typewolf',
      url: 'https://www.typewolf.com/',
      note: 'display serif and humanist sans pairings',
    },
  ],
  tokens: {
    '--color-bg': '#f8eeeb',
    '--color-surface': '#fffaf8',
    '--color-sunken': '#f1e2de',
    '--color-text': '#3a221b',
    '--color-text-muted': '#6b4f47',
    '--color-border': '#e5cfc8',
    '--color-border-strong': '#a07f75',
    '--color-focus': '#2f5aa8',
    '--color-accent': '#4a2b20',
    '--color-accent-hover': '#331d15',
    '--color-accent-soft': '#f3e4df',
    '--color-on-accent': '#fffaf8',
    '--color-ok': '#1f6334',
    '--color-ok-soft': '#e6f0e3',
    '--color-warn': '#6e4800',
    '--color-warn-soft': '#f6dc9a',
    '--color-warn-border': '#c08a1a',
    '--color-danger': '#9b2519',
    '--color-danger-soft': '#fbe0db',
    '--font-body':
      "'Nunito Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-heading':
      "'Gilda Display', 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif",
    '--text-2xl': '2.25rem',
    '--weight-heading': '400',
    '--radius': '10px',
  },
  tweaks: `
/* A fine double line under each title */
h1,
h2,
.page-header {
  padding-bottom: var(--space-2);
  border-bottom: 3px double var(--color-border-strong);
}

/* in a header with a figure, the line runs under both */
.page-header h1 {
  padding-bottom: 0;
  border-bottom: 0;
}

.list {
  border-color: var(--color-border);
}

.empty-state {
  background: var(--color-sunken);
  border: 0;
}

.btn-primary {
  font-weight: 700;
}

.btn-quiet {
  text-decoration: underline;
  text-decoration-color: var(--color-border-strong);
}

.num {
  font-weight: 600;
}

.stock-qty {
  font-size: 1.375rem;
  font-weight: 700;
}

.badge-warn {
  border: 1px solid var(--color-warn-border);
}

.topbar {
  background: var(--color-bg);
}

.brand {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 400;
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-sunken);
  }
}
`,
})
