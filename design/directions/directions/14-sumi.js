// 14 Sumi: paper and ink. One look-book direction: its palette, fonts,
// sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 14,
  id: 'sumi',
  name: 'Sumi',
  family: 'Calm',
  dark: false,
  lang: 'zh',
  line: 'Paper and ink: wide margins, thin ink lines, a square indigo seal.',
  idea:
    'Unbleached paper, ink-black type and a lot of deliberate empty space, the Japanese idea of ma. ' +
    'Lines are as thin as a brush’s lightest stroke, and the one colour is aizome indigo, used for the logo seal ' +
    'and the main action. In Chinese the page title stands upright in the margin, the way it would on paper.',
  signature: 'In Chinese, the page title runs vertically down the margin; the logo becomes a square indigo seal.',
  fonts: [
    {
      family: 'Noto Serif',
      role: 'titles',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/noto/specimen/Noto+Serif',
    },
    {
      family: 'Noto Sans',
      role: 'text and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/noto/specimen/Noto+Sans',
    },
  ],
  gf: ['family=Noto+Serif:wght@400;500;600', 'family=Noto+Sans:wght@400;500;600'],
  inspiration: [
    {
      label: 'The concept of ma',
      url: 'https://www.newtarget.com/web-insights-blog/concept-of-ma/',
      note: 'empty space as a working part of the layout, not leftover',
    },
    {
      label: 'Japanese colour glossary',
      url: 'https://colorcombinations.pages.dev/learn/japanese-color-glossary/',
      note: 'sumi ink black, kinari unbleached cream, aizome indigo',
    },
    {
      label: 'Google Noto',
      url: 'https://fonts.google.com/noto',
      note: 'Latin type drawn to sit with the Noto / Source Han Chinese fonts many phones carry',
    },
  ],
  tokens: {
    '--color-bg': '#f3eee3',
    '--color-surface': '#faf7f0',
    '--color-sunken': '#ebe5d7',
    '--color-text': '#1c1a17',
    '--color-text-muted': '#5b564c',
    '--color-border': '#d6cfbf',
    '--color-border-strong': '#8a8270',
    '--color-focus': '#1c1a17',
    '--color-accent': '#233f66',
    '--color-accent-hover': '#18304f',
    '--color-accent-soft': '#e4e8ee',
    '--color-on-accent': '#faf7f0',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e5efe3',
    '--color-warn': '#774700',
    '--color-warn-soft': '#f8ead0',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#a1241a',
    '--color-danger-soft': '#f7e3dc',
    '--font-body':
      "'Noto Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-heading':
      "'Noto Serif', 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif",
    '--weight-heading': '500',
    '--tracking-heading': '0.04em',
    '--space-5': '2rem',
    '--space-6': '2.75rem',
    '--space-7': '4rem',
    '--radius': '0px',
  },
  tweaks: `
/* The logo as a square seal */
.bm-tile {
  rx: 0;
}

h2 {
  font-size: var(--text-lg);
  letter-spacing: 0.08em;
}

.list {
  background: transparent;
  border: 0;
  border-top: 1px solid var(--color-text);
  border-bottom: 1px solid var(--color-text);
}

.list-row {
  min-height: 4rem;
  padding-left: 0;
  padding-right: 0;
}

.list-row-title {
  font-weight: 500;
}

.empty-state {
  padding: 0;
  border: 0;
}

.btn-primary {
  font-weight: 500;
  letter-spacing: 0.06em;
}

.topbar {
  background: var(--color-bg);
  border-bottom-color: transparent;
}

.mainnav {
  background: var(--color-bg);
}

/* The current tab: ink-black label with a small indigo dot */
.mainnav a.active {
  color: var(--color-text);
  box-shadow: none;
}

.mainnav a.active::after {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
}

/* Chinese: the page title stands upright in the margin */
.page:lang(zh) {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: var(--space-4);
}

.page:lang(zh) > * {
  grid-column: 2;
}

.page:lang(zh) > h1,
.page:lang(zh) > .page-header {
  grid-column: 1;
  grid-row: 1 / span 8;
  margin: 0;
  padding-top: var(--space-1);
}

.page:lang(zh) > h1,
.page:lang(zh) > .page-header h1 {
  writing-mode: vertical-rl;
  letter-spacing: 0.35em;
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-sunken);
  }

  .mainnav a.active::after {
    display: none;
  }
}
`,
})
