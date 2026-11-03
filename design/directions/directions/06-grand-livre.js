// 06 Grand livre: the accounting ledger. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 6,
  id: 'grand-livre',
  name: 'Grand livre',
  family: 'Paper and print',
  dark: false,
  lang: 'en',
  line: 'Bookkeeper’s ledger: a ruled money column, double rules, blue-black ink.',
  idea:
    'The app is a ledger underneath, so this direction looks like one: buff ledger paper, blue-black ink, ' +
    'fine blue rules under every line and a ruled-off column for money and quantities, typed like an old account book. ' +
    'Page titles carry the double rule a bookkeeper draws under a total.',
  signature: 'A double vertical rule that sets off the money column, as on columnar ledger paper.',
  fonts: [
    {
      family: 'Spectral',
      role: 'text and headings',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Spectral',
    },
    {
      family: 'Courier Prime',
      role: 'money and quantities',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Courier+Prime',
    },
  ],
  gf: ['family=Spectral:ital,wght@0,400;0,500;0,600;1,400', 'family=Courier+Prime:wght@400;700'],
  inspiration: [
    {
      label: 'Ledger (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Ledger',
      note: 'the book of accounts the app keeps underneath',
    },
    {
      label: 'Green bar paper',
      url: 'https://pdp8online.com/images/greenbar.shtml',
      note: 'ruled bands that help the eye follow a line across a wide report',
    },
    {
      label: 'Courier Prime',
      url: 'https://quoteunquoteapps.com/courierprime/',
      note: 'a typewriter face redrawn to read well on screen',
    },
  ],
  tokens: {
    '--color-bg': '#f3ecd6',
    '--color-surface': '#fbf7ea',
    '--color-sunken': '#ebe2c8',
    '--color-text': '#1d2433',
    '--color-text-muted': '#4b5163',
    '--color-border': '#b9c6d8',
    '--color-border-strong': '#6d7a90',
    '--color-focus': '#1f4fbf',
    '--color-accent': '#22386a',
    '--color-accent-hover': '#182a52',
    '--color-accent-soft': '#e2e6ef',
    '--color-on-accent': '#fbf7ea',
    '--color-ok': '#1d6634',
    '--color-ok-soft': '#e5eedc',
    '--color-warn': '#734600',
    '--color-warn-soft': '#f7e7c2',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#9c2418',
    '--color-danger-soft': '#f6e1da',
    '--font-body':
      "'Spectral', 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif",
    '--font-num':
      "'Courier Prime', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', ui-monospace, monospace",
    '--text-md': '1.0625rem',
    '--weight-heading': '600',
    '--radius': '2px',
    '--brand-tile': '#22386a',
    '--brand-paper': '#fbf7ea',
  },
  tweaks: `
/* Page titles over a double rule, like a ruled-off total */
.page > h1,
.page-header {
  padding-bottom: var(--space-2);
  border-bottom: 3px double var(--color-text);
}

h2 {
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-border-strong);
  font-size: var(--text-lg);
  font-variant-caps: all-small-caps;
  letter-spacing: 0.06em;
}

.list {
  border-color: var(--color-border-strong);
  border-radius: 0;
}

/* The money column, ruled off with a double line */
.list-row {
  align-items: stretch;
  padding-top: 0;
  padding-bottom: 0;
}

.list-row-main {
  align-self: center;
  padding: var(--space-3) 0;
}

.list-row > .num,
.list-row-end {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  min-width: 7rem;
  padding: var(--space-2) 0 var(--space-2) var(--space-3);
  border-left: 3px double var(--color-border-strong);
}

.num {
  font-size: 1.0625rem;
}

.stock-qty {
  font-size: 1.25rem;
  font-weight: 700;
}

.empty-state {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-style: italic;
}

.topbar {
  background: var(--color-bg);
  border-bottom: 3px double var(--color-border-strong);
}

.mainnav {
  border-top: 3px double var(--color-border-strong);
}
`,
})
