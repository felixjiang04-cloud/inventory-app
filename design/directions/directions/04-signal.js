// 04 Signal: wayfinding signage. One look-book direction: its palette, fonts,
// sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 4,
  id: 'signal',
  name: 'Signal',
  family: 'Grid and system',
  dark: false,
  lang: 'en',
  line: 'Station signage: white-on-black bands, big mixed-case type, arrows.',
  idea:
    'Designed like transit signs that are read in a glance while moving: page titles sit on full-width black ' +
    'sign bands, type is large and mixed case, and every row you can open ends in an arrow. ' +
    'The typeface was drawn so that letters like l, 1 and I cannot be confused.',
  signature: 'Full-width black sign bands for the page title and the tab bar.',
  fonts: [
    {
      family: 'Atkinson Hyperlegible Next',
      role: 'everything',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next',
    },
  ],
  gf: ['family=Atkinson+Hyperlegible+Next:wght@400;700;800'],
  inspiration: [
    {
      label: 'NYCTA Graphics Standards Manual',
      url: 'https://standardsmanual.com/',
      note: 'Unimark’s subway signs: white type on black bands',
    },
    {
      label: 'Jock Kinneir and Margaret Calvert',
      url: 'https://designmuseum.org/design/jock-kinneir-margaret-calvert',
      note: 'mixed-case road signs, tested for reading at speed',
    },
    {
      label: 'Atkinson Hyperlegible',
      url: 'https://en.wikipedia.org/wiki/Atkinson_Hyperlegible',
      note: 'Braille Institute’s typeface with letters that can’t be mistaken for each other',
    },
  ],
  tokens: {
    '--color-bg': '#f3f1ec',
    '--color-surface': '#ffffff',
    '--color-sunken': '#e9e6df',
    '--color-text': '#141311',
    '--color-text-muted': '#4e4a44',
    '--color-border': '#d2cdc3',
    '--color-border-strong': '#7b766d',
    '--color-focus': '#1b5fd0',
    '--color-accent': '#141311',
    '--color-accent-hover': '#34322e',
    '--color-accent-soft': '#e4e1da',
    '--color-on-accent': '#ffffff',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e5f0e7',
    '--color-warn': '#774700',
    '--color-warn-soft': '#faeed4',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#a1241a',
    '--color-danger-soft': '#fae6e2',
    '--font-body':
      "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--text-md': '1.0625rem',
    '--text-lg': '1.25rem',
    '--text-2xl': '2rem',
    '--weight-strong': '700',
    '--weight-heading': '800',
    '--radius': '4px',
    '--brand-tile': '#141311',
    '--brand-paper': '#ffffff',
  },
  extraPairs: [
    ['Tab labels on the black bar', '#c9c5bd', '#141311', 4.5],
    ['Focus ring on the black bar', '#1b5fd0', '#141311', 3],
  ],
  tweaks: `
/* The page title is a sign band, edge to edge */
.page > h1 {
  margin: calc(-1 * var(--space-5)) calc(-1 * var(--space-4)) var(--space-5);
  padding: var(--space-4) var(--space-4) var(--space-3);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

h2 {
  padding-bottom: var(--space-2);
  border-bottom: 3px solid var(--color-text);
  font-size: var(--text-lg);
}

/* Rows that open something end in an arrow */
a.list-row::after {
  content: '→';
  font-size: 1.375rem;
  font-weight: 700;
}

.btn-large {
  min-height: 3.75rem;
  font-size: var(--text-lg);
}

.topbar {
  border-bottom: 0;
}

.mainnav {
  background: var(--color-accent);
  border-top: 0;
}

.mainnav a {
  color: #c9c5bd;
}

.mainnav a.active {
  color: #ffffff;
  box-shadow: inset 0 -5px 0 #ffffff;
}

.mainnav .icon {
  stroke-width: 2.25px;
}

@media (min-width: 900px) {
  .page > h1 {
    margin-top: 0;
  }

  .shell .topbar {
    background: var(--color-accent);
    border-right: 0;
  }

  .brand,
  .brand:hover {
    color: #ffffff;
  }

  .mainnav {
    border-right: 0;
  }

  .mainnav a:hover {
    background: #2a2825;
  }

  .mainnav a.active {
    background: #34322e;
    box-shadow: inset 5px 0 0 #ffffff;
  }
}
`,
})
