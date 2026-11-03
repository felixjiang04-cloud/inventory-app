// 19 Ardoise: the slate menu board. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 19,
  id: 'ardoise',
  name: 'Ardoise',
  family: 'Dark',
  dark: true,
  lang: 'en',
  line: 'Slate menu board: tall condensed capitals, big figures, one chalk-pink accent.',
  idea:
    'The slate board by the pass, where the specials are chalked up: warm dark slate, chalk-white condensed capitals ' +
    'and big figures you can read from across the kitchen. One chalk-pink accent marks what to do next. ' +
    'No chalk texture, just the proportions.',
  signature: 'Tall condensed capitals for titles, item names and figures, set like a chalked price board.',
  fonts: [
    {
      family: 'Barlow Condensed',
      role: 'titles, item names and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Barlow+Condensed',
    },
    {
      family: 'Barlow',
      role: 'text',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Barlow',
    },
  ],
  gf: ['family=Barlow+Condensed:wght@500;600;700', 'family=Barlow:ital,wght@0,400;0,500;0,600;1,400'],
  inspiration: [
    {
      label: 'Blackboard (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Blackboard',
      note: 'the slate board, still how bistros post the day’s dishes',
    },
    {
      label: 'Barlow',
      url: 'https://fonts.google.com/specimen/Barlow',
      note: 'a low-contrast grotesk drawn from California road signs and licence plates',
    },
    {
      label: 'Hamilton Wood Type & Printing Museum',
      url: 'https://woodtype.org/',
      note: 'tall figures made to be read from across a room',
    },
  ],
  tokens: {
    '--color-bg': '#2a2825',
    '--color-surface': '#33302c',
    '--color-sunken': '#3c3934',
    '--color-text': '#f3efe7',
    '--color-text-muted': '#b8b1a5',
    '--color-border': '#4a4640',
    '--color-border-strong': '#948d80',
    '--color-focus': '#f3efe7',
    '--color-accent': '#eda6d6',
    '--color-accent-hover': '#f5c4e4',
    '--color-accent-soft': '#45333f',
    '--color-on-accent': '#2a2825',
    '--color-ok': '#93d4a3',
    '--color-ok-soft': '#233528',
    '--color-warn': '#f0c46e',
    '--color-warn-soft': '#3d3119',
    '--color-warn-border': '#c99a3e',
    '--color-danger': '#ff9b7f',
    '--color-danger-soft': '#45241d',
    '--font-body':
      "'Barlow', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-heading':
      "'Barlow Condensed', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-num':
      "'Barlow Condensed', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--text-xl': '1.625rem',
    '--text-2xl': '2.75rem',
    '--weight-heading': '600',
    '--radius': '4px',
  },
  tweaks: `
:root {
  color-scheme: dark;
}

h1,
h2 {
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

h1 {
  line-height: 1;
}

.list {
  background: transparent;
  border: 0;
  border-top: 2px solid var(--color-text);
  border-bottom: 2px solid var(--color-text);
}

.list-row {
  padding-left: 0;
  padding-right: 0;
}

.list-row-title {
  font-family: var(--font-heading);
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.num {
  font-size: 1.5rem;
  font-weight: 600;
}

.list-row-meta.num {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 400;
}

.stock-qty {
  font-size: 2.25rem;
  line-height: 1;
}

.btn-primary {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.topbar {
  background: var(--color-bg);
}

.brand {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.mainnav {
  background: var(--color-bg);
  border-top: 2px solid var(--color-text);
}

.mainnav a {
  font-family: var(--font-heading);
  font-size: 0.9375rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mainnav a.active {
  box-shadow: inset 0 5px 0 var(--color-accent);
}

@media (min-width: 900px) {
  .mainnav a.active {
    box-shadow: inset 5px 0 0 var(--color-accent);
  }
}
`,
})
