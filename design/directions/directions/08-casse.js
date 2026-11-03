// 08 Casse: letterpress wood type. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 8,
  id: 'casse',
  name: 'Casse',
  family: 'Paper and print',
  dark: false,
  lang: 'en',
  line: 'Wood type: heavy slab headings and figures on newsprint, thick-thin rules.',
  idea:
    'Named after the printer’s type case. Titles and the important figures are set in a heavy slab serif, ' +
    'like wood type on a market poster; everything else stays small and plain, ' +
    'and sections are divided by the thick-and-thin rule printers used.',
  signature: 'Heavy slab-serif figures, and a thick-thin printer’s rule above each section.',
  fonts: [
    {
      family: 'Zilla Slab',
      role: 'titles and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Zilla+Slab',
    },
    {
      family: 'Work Sans',
      role: 'text',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Work+Sans',
    },
  ],
  gf: ['family=Zilla+Slab:wght@500;600;700', 'family=Work+Sans:wght@400;500;600'],
  inspiration: [
    {
      label: 'Hamilton Wood Type & Printing Museum',
      url: 'https://woodtype.org/',
      note: 'wood-type figures and widely spaced capitals',
    },
    {
      label: 'Septime',
      url: 'https://www.septime-charonne.fr/',
      note: 'a Paris restaurant whose only flourish is a wood-type mark',
    },
    {
      label: 'Zilla Slab',
      url: 'https://fonts.google.com/specimen/Zilla+Slab',
      note: 'Mozilla’s slab serif, sturdy enough for poster figures',
    },
  ],
  tokens: {
    '--color-bg': '#eeeae0',
    '--color-surface': '#f8f6f0',
    '--color-sunken': '#e4dfd3',
    '--color-text': '#151412',
    '--color-text-muted': '#504b43',
    '--color-border': '#cfc8ba',
    '--color-border-strong': '#7f786c',
    '--color-focus': '#2052b8',
    '--color-accent': '#5a3a22',
    '--color-accent-hover': '#432a17',
    '--color-accent-soft': '#ebe1d3',
    '--color-on-accent': '#f8f6f0',
    '--color-ok': '#1e6334',
    '--color-ok-soft': '#e4eedf',
    '--color-warn': '#6e4800',
    '--color-warn-soft': '#f6dc9a',
    '--color-warn-border': '#c08a1a',
    '--color-danger': '#9b2519',
    '--color-danger-soft': '#f6e2dc',
    '--font-body':
      "'Work Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-heading':
      "'Zilla Slab', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', serif",
    '--font-num':
      "'Zilla Slab', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', serif",
    '--text-2xl': '2.5rem',
    '--weight-heading': '700',
    '--radius': '2px',
  },
  tweaks: `
h1 {
  line-height: 1;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

/* A printer's thick-and-thin rule above each section */
h2 {
  padding-top: 3px;
  border-top: 4px solid var(--color-text);
}

h2::before {
  content: '';
  display: block;
  margin-bottom: var(--space-2);
  border-top: 1px solid var(--color-text);
}

.list {
  background: transparent;
  border: 0;
  border-top: 1px solid var(--color-text);
  border-bottom: 1px solid var(--color-text);
}

.list-row {
  padding-left: 0;
  padding-right: 0;
}

.list-row-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 600;
}

.num {
  font-size: 1.25rem;
  font-weight: 700;
}

.list-row-meta.num {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 400;
}

.stock-qty {
  font-size: 1.75rem;
  line-height: 1;
}

.btn-primary {
  font-family: var(--font-heading);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.empty-state {
  border: 1px solid var(--color-text);
}

.badge-warn {
  border: 1px solid var(--color-warn-border);
}

.topbar {
  background: var(--color-bg);
  border-bottom-color: var(--color-text);
}

.brand {
  font-family: var(--font-heading);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mainnav {
  background: var(--color-bg);
  border-top: 4px solid var(--color-text);
}

.mainnav a.active {
  color: var(--color-text);
  box-shadow: inset 0 -4px 0 var(--color-accent);
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-sunken);
    box-shadow: inset 4px 0 0 var(--color-accent);
  }
}
`,
})
