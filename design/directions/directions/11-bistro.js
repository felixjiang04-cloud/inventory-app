// 11 Bistro: the menu card. One look-book direction: its palette, fonts,
// sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 11,
  id: 'bistro',
  name: 'Bistro',
  family: 'Kitchen',
  dark: false,
  lang: 'fr',
  line: 'Menu card: dotted leaders from item to figure, an enamel street-plaque title.',
  idea:
    'Set like a bistro menu card: black serif on cream, and dotted leaders running from each item to its figure, ' +
    'so the eye travels straight across. ' +
    'The page title sits on a small enamel plaque, the white-on-blue of Paris street signs.',
  signature: 'Dotted leaders between each item and its number, and an enamel-blue title plaque.',
  fonts: [
    {
      family: 'Bodoni Moda',
      role: 'titles and item names',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Bodoni+Moda',
    },
    {
      family: 'Jost',
      role: 'text and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Jost',
    },
  ],
  gf: [
    'family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,700;1,6..96,500',
    'family=Jost:ital,wght@0,400;0,500;0,600;1,400',
  ],
  inspiration: [
    {
      label: 'The street name plaques of Paris',
      url: 'https://frenchmoments.eu/street-name-plaques-of-paris/',
      note: 'white lettering on azure enamel, standard since 1847',
    },
    {
      label: 'St. JOHN',
      url: 'https://stjohnrestaurant.com/',
      note: 'a restaurant site in black serif on white, with almost nothing else',
    },
    {
      label: 'Bodoni Moda',
      url: 'https://fonts.google.com/specimen/Bodoni+Moda',
      note: 'a Didone with optical sizes, so titles stay crisp',
    },
  ],
  tokens: {
    '--color-bg': '#f6f1e5',
    '--color-surface': '#fdfaf2',
    '--color-sunken': '#efe8d8',
    '--color-text': '#1a1714',
    '--color-text-muted': '#5a5248',
    '--color-border': '#d9cfbd',
    '--color-border-strong': '#8a7f6d',
    '--color-focus': '#1a1714',
    '--color-accent': '#1d3f94',
    '--color-accent-hover': '#142d6b',
    '--color-accent-soft': '#e3e8f4',
    '--color-on-accent': '#ffffff',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e6f0e2',
    '--color-warn': '#774700',
    '--color-warn-soft': '#f9ecd0',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#a1241a',
    '--color-danger-soft': '#f9e4df',
    '--font-body':
      "'Jost', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-heading':
      "'Bodoni Moda', 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif",
    '--weight-heading': '700',
    '--radius': '4px',
  },
  tweaks: `
/* The page title on an enamel plaque */
.page > h1,
.page-header > h1 {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: var(--color-on-accent);
  border-radius: var(--radius);
  outline: 1.5px solid var(--color-on-accent);
  outline-offset: -5px;
  font-size: var(--text-xl);
}

h2 {
  font-style: italic;
  font-weight: 500;
}

/* Menu-card rows: item, dotted leader, figure */
.list {
  background: transparent;
  border: 0;
}

.list > li + li {
  border-top: 0;
}

/* only rows that end in a figure; a row that is just a link keeps its layout */
.list-row:has(> .num),
.list-row:has(> .list-row-end) {
  display: grid;
  grid-template-columns: auto minmax(1.5rem, 1fr) auto;
  grid-template-areas:
    'title leader figure'
    'meta meta extra';
  align-items: baseline;
  gap: 0 var(--space-2);
  padding: var(--space-2) 0;
}

.list-row:has(> .num) > .list-row-main,
.list-row:has(> .list-row-end) > .list-row-main,
.list-row > .list-row-end {
  display: contents;
}

.list-row-main > .list-row-title {
  grid-area: title;
}

.list-row-main > .list-row-meta {
  grid-area: meta;
}

.list-row:has(> .num)::before,
.list-row:has(> .list-row-end)::before {
  content: '';
  grid-area: leader;
  border-bottom: 2px dotted var(--color-border-strong);
}

.list-row > .num,
.list-row-end > .num:not(.list-row-meta) {
  grid-area: figure;
  font-size: 1.125rem;
  font-weight: 600;
}

/* under the figure: what was spent, or whether the invoice needs checking */
.list-row-end > .list-row-meta,
.list-row-end > .badge {
  grid-area: extra;
  justify-self: end;
}

.list-row-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 500;
}

.btn-primary {
  font-family: var(--font-heading);
  font-size: 1.25rem;
}

.empty-state {
  border: 1px solid var(--color-border-strong);
  font-style: italic;
}

.topbar {
  background: var(--color-bg);
  border-bottom-color: var(--color-text);
}

.brand {
  font-family: var(--font-heading);
  font-size: 1.0625rem;
}

.mainnav {
  border-top-color: var(--color-text);
}
`,
})
