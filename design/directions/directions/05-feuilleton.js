// 05 Feuilleton: editorial. One look-book direction: its palette, fonts,
// sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 5,
  id: 'feuilleton',
  name: 'Feuilleton',
  family: 'Paper and print',
  dark: false,
  lang: 'en',
  line: 'Magazine page: serif headlines, italic section titles, mono details.',
  idea:
    'Reads like a well-set magazine page: a serif with real character for headlines, italic section titles, ' +
    'small monospaced capitals for dates and labels, and single rules instead of boxes. ' +
    'It is the calmest direction for longer French and English text.',
  signature: 'Italic serif section titles over monospaced capitals for dates and labels.',
  fonts: [
    {
      family: 'Newsreader',
      role: 'text and headings',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Newsreader',
    },
    {
      family: 'DM Mono',
      role: 'dates, labels and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/DM+Mono',
    },
  ],
  gf: [
    'family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500',
    'family=DM+Mono:wght@400;500',
  ],
  inspiration: [
    {
      label: 'Works in Progress',
      url: 'https://worksinprogress.co/',
      note: 'monospaced interface labels with serif headlines and plain rules',
    },
    {
      label: 'Kinfolk',
      url: 'https://www.kinfolk.com/',
      note: 'a classic serif and generous white space',
    },
    {
      label: 'Typewolf',
      url: 'https://www.typewolf.com/',
      note: 'serif and mono pairings in real editorial use',
    },
  ],
  tokens: {
    '--color-bg': '#fdfcfa',
    '--color-surface': '#fdfcfa',
    '--color-sunken': '#f3f0ea',
    '--color-text': '#16130f',
    '--color-text-muted': '#5a554d',
    '--color-border': '#d8d2c7',
    '--color-border-strong': '#8c857a',
    '--color-focus': '#1f5fbf',
    '--color-accent': '#16130f',
    '--color-accent-hover': '#3b362f',
    '--color-accent-soft': '#efebe4',
    '--color-on-accent': '#fdfcfa',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e6f1e8',
    '--color-warn': '#7a4a00',
    '--color-warn-soft': '#fbf0d9',
    '--color-warn-border': '#c98a1c',
    '--color-danger': '#a2251b',
    '--color-danger-soft': '#fbe9e6',
    '--font-body':
      "'Newsreader', 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif",
    '--font-num':
      "'DM Mono', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', ui-monospace, monospace",
    '--text-md': '1.0625rem',
    '--text-xl': '1.5rem',
    '--text-2xl': '2.5rem',
    '--weight-strong': '600',
    '--weight-heading': '500',
    '--tracking-heading': '-0.01em',
    '--radius': '0px',
  },
  tweaks: `
h1 {
  font-weight: 400;
}

/* Section titles in italic, under a black rule */
h2 {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-text);
  font-style: italic;
  font-weight: 400;
}

.list {
  background: transparent;
  border: 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.list-row {
  padding-left: 0;
  padding-right: 0;
}

.list-row-title {
  font-size: var(--text-lg);
  font-weight: 500;
}

/* Dates and labels in small monospaced capitals */
.list-row-meta {
  font-family: var(--font-num);
  font-size: 0.8125rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.stock-qty {
  font-size: 1.375rem;
  font-weight: 500;
}

.btn {
  font-weight: 500;
}

.btn-primary {
  font-size: 1.25rem;
  font-style: italic;
}

.btn-quiet {
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-thickness: 1px;
}

.empty-state {
  padding: var(--space-1) 0 var(--space-1) var(--space-4);
  border: 0;
  border-left: 1px solid var(--color-text);
  font-style: italic;
}

.topbar {
  border-bottom-color: var(--color-text);
}

.brand {
  font-family: var(--font-num);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mainnav {
  border-top-color: var(--color-text);
}

.mainnav a {
  font-family: var(--font-num);
  font-size: 0.8125rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.mainnav a.active {
  color: var(--color-text);
  box-shadow: inset 0 2px 0 var(--color-text);
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-sunken);
    box-shadow: inset 2px 0 0 var(--color-text);
  }
}
`,
})
