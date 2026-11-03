// 01 Raster: Swiss grid. One look-book direction: its palette, fonts, sources
// and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 1,
  id: 'raster',
  name: 'Raster',
  family: 'Grid and system',
  dark: false,
  lang: 'en',
  line: 'Swiss grid: flush-left type, hairlines instead of boxes, the figures set large.',
  idea:
    'Built the way Swiss posters were: one grid, flush-left type and no boxes, only hairlines between rows. ' +
    'The figures you came for are set large on a right-hand column, so amounts line up like a timetable.',
  signature: 'Oversized tabular figures on a fixed right column; everything else small and quiet.',
  fonts: [
    {
      family: 'Archivo',
      role: 'everything',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Archivo',
    },
  ],
  gf: ['family=Archivo:wght@400;500;600;700;800'],
  inspiration: [
    {
      label: 'Swiss Style (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Swiss_Style_(design)',
      note: 'start from a grid, align flush left, sans serif, no ornament',
    },
    {
      label: 'Vitsœ, Good design',
      url: 'https://www.vitsoe.com/us/about/good-design',
      note: 'two weights, heading on the left and text on the right, nothing extra',
    },
    {
      label: 'Grid Systems in Graphic Design',
      url: 'https://designreviewed.com/artefacts/grid-systems-in-graphic-design-josef-muller-brockmann-niggli-verlag-2015/',
      note: 'Müller-Brockmann’s manual of the modular grid',
    },
  ],
  tokens: {
    '--color-bg': '#fbfaf7',
    '--color-surface': '#fbfaf7',
    '--color-sunken': '#efede7',
    '--color-text': '#141311',
    '--color-text-muted': '#5c5850',
    '--color-border': '#d9d5cd',
    '--color-border-strong': '#8a847a',
    '--color-focus': '#141311',
    '--color-accent': '#2338b8',
    '--color-accent-hover': '#1a2a8c',
    '--color-accent-soft': '#e6e9f8',
    '--color-on-accent': '#ffffff',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e6f1e8',
    '--color-warn': '#7a4a00',
    '--color-warn-soft': '#fbf0d9',
    '--color-warn-border': '#c98a1c',
    '--color-danger': '#a2251b',
    '--color-danger-soft': '#fbe9e6',
    '--font-body':
      "'Archivo', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--text-2xl': '2.5rem',
    '--weight-heading': '700',
    '--tracking-heading': '-0.02em',
    '--radius': '0px',
  },
  tweaks: `
h1 {
  margin-bottom: var(--space-5);
}

/* Section labels: small capitals on a black rule */
h2 {
  margin-top: var(--space-7);
  padding-top: var(--space-2);
  border-top: 2px solid var(--color-text);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Lists: no box, only hairlines between rows */
.list {
  background: transparent;
  border: 0;
}

.list-row {
  padding-left: 0;
  padding-right: 0;
}

/* The figures column, set large */
.list-row > .num {
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.stock-qty {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1;
}

.empty-state {
  padding: var(--space-1) 0 var(--space-1) var(--space-4);
  border: 0;
  border-left: 2px solid var(--color-text);
}

.topbar {
  border-bottom: 2px solid var(--color-text);
}

.mainnav {
  border-top: 2px solid var(--color-text);
}

.mainnav a.active {
  color: var(--color-text);
  box-shadow: inset 0 4px 0 var(--color-accent);
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: transparent;
    box-shadow: inset 4px 0 0 var(--color-accent);
  }
}
`,
})
