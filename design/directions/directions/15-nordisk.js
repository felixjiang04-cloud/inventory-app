// 15 Nordisk: Scandinavian. One look-book direction: its palette, fonts,
// sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 15,
  id: 'nordisk',
  name: 'Nordisk',
  family: 'Calm',
  dark: false,
  lang: 'en',
  line: 'Scandinavian air: pale warm grey, dusty blue, soft corners, one pale panel.',
  idea:
    'Light, airy and quiet, like a Copenhagen shop: pale warm greys, a dusty blue accent and soft 12 px corners. ' +
    'The main action sits in its own pale panel, so every screen has one clear place to start.',
  signature: 'The main action in a pale blue panel at the top of Home, with generous soft corners.',
  fonts: [
    {
      family: 'Schibsted Grotesk',
      role: 'everything',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Schibsted+Grotesk',
    },
  ],
  gf: ['family=Schibsted+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  inspiration: [
    {
      label: 'Norm Architects',
      url: 'https://normcph.com/',
      note: 'Copenhagen studio: pale surfaces, soft light, very little on the page',
    },
    {
      label: 'Kinfolk',
      url: 'https://www.kinfolk.com/',
      note: 'the Copenhagen magazine’s calm, airy pages',
    },
    {
      label: 'Schibsted Grotesk',
      url: 'https://fonts.google.com/specimen/Schibsted+Grotesk',
      note: 'a plain, friendly grotesk made for the Nordic media group Schibsted',
    },
  ],
  tokens: {
    '--color-bg': '#f2f1ed',
    '--color-surface': '#fdfcfa',
    '--color-sunken': '#e9e7e2',
    '--color-text': '#26241f',
    '--color-text-muted': '#5e5a52',
    '--color-border': '#dedad2',
    '--color-border-strong': '#8d887e',
    '--color-focus': '#3b6ea8',
    '--color-accent': '#44627c',
    '--color-accent-hover': '#34506a',
    '--color-accent-soft': '#e3eaf0',
    '--color-on-accent': '#ffffff',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e5f0e7',
    '--color-warn': '#774700',
    '--color-warn-soft': '#faeed4',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#a1241a',
    '--color-danger-soft': '#fae6e2',
    '--font-body':
      "'Schibsted Grotesk', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--tracking-heading': '-0.01em',
    '--leading': '1.5',
    '--space-5': '1.75rem',
    '--radius': '12px',
  },
  tweaks: `
/* The one place to start: the main action in a pale panel */
.home-actions {
  align-items: stretch;
  padding: var(--space-4);
  background: var(--color-accent-soft);
  border-radius: var(--radius);
}

.home-actions .btn-quiet {
  align-self: flex-start;
}

.empty-state {
  background: var(--color-sunken);
  border: 0;
}

h2 {
  font-size: var(--text-lg);
}

.stock-qty {
  font-size: 1.375rem;
}

.topbar {
  background: var(--color-bg);
  border-bottom: 0;
}

.mainnav {
  border-top: 0;
}

.mainnav a.active {
  background: var(--color-accent-soft);
  box-shadow: none;
}

@media (min-width: 900px) {
  .home-actions {
    max-width: 30rem;
  }

  .home-actions .btn-block {
    width: 100%;
  }
}
`,
})
