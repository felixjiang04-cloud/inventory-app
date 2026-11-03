// 17 Plan: the architect's sheet. One look-book direction: its palette, fonts,
// sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 17,
  id: 'plan',
  name: 'Plan',
  family: 'Calm',
  dark: false,
  lang: 'en',
  line: 'Architect’s sheet: a title-block header, thin black lines, pale blue construction lines.',
  idea:
    'Drawn like an architect’s sheet: thin precise black lines, a lot of white, small monospaced annotations, ' +
    'and a title block in the header that names the drawing, here the screen. ' +
    'Rows are divided by pale drafting-blue construction lines that run edge to edge.',
  signature: 'A ruled title block naming the screen, and full-width pale blue construction lines between rows.',
  fonts: [
    {
      family: 'Hanken Grotesk',
      role: 'text and titles',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Hanken+Grotesk',
    },
    {
      family: 'Spline Sans Mono',
      role: 'annotations and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Spline+Sans+Mono',
    },
  ],
  gf: [
    'family=Hanken+Grotesk:ital,wght@0,300;0,400;0,500;0,600;1,400',
    'family=Spline+Sans+Mono:wght@400;500',
  ],
  inspiration: [
    {
      label: 'Herzog & de Meuron',
      url: 'https://www.herzogdemeuron.com/',
      note: 'an architecture office’s site: a mono search line and bare structure',
    },
    {
      label: 'John Pawson',
      url: 'https://www.johnpawson.com/',
      note: 'one image, a small name, nothing else',
    },
    {
      label: 'Non-photo blue (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Non-photo_blue',
      note: 'the pale blue of construction lines on drawing sheets',
    },
  ],
  tokens: {
    '--color-bg': '#fafaf7',
    '--color-surface': '#fafaf7',
    '--color-sunken': '#f0efea',
    '--color-text': '#161615',
    '--color-text-muted': '#555450',
    '--color-border': '#9fcfe0',
    '--color-border-strong': '#161615',
    '--color-focus': '#1f5fd0',
    '--color-accent': '#161615',
    '--color-accent-hover': '#3a3936',
    '--color-accent-soft': '#eceae4',
    '--color-on-accent': '#fafaf7',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e6f1e8',
    '--color-warn': '#7a4a00',
    '--color-warn-soft': '#fbf0d9',
    '--color-warn-border': '#c98a1c',
    '--color-danger': '#a2251b',
    '--color-danger-soft': '#fbe9e6',
    '--font-body':
      "'Hanken Grotesk', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-num':
      "'Spline Sans Mono', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', ui-monospace, monospace",
    '--text-2xl': '2.25rem',
    '--weight-strong': '500',
    '--weight-heading': '300',
    '--tracking-heading': '-0.01em',
    '--radius': '0px',
  },
  tweaks: `
/* The title block: the app's name and the name of this sheet */
.topbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0;
  min-height: 0;
  margin: var(--space-3) var(--space-4) 0;
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-text);
}

.brand {
  padding: 0 var(--space-3);
  border-right: 1px solid var(--color-text);
  font-size: var(--text-sm);
}

.topbar::after {
  content: attr(data-screen);
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
  font-family: var(--font-num);
  font-size: 0.8125rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h2 {
  font-family: var(--font-num);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Construction lines from edge to edge */
.list {
  margin: 0 calc(-1 * var(--space-4));
  background: transparent;
  border: 0;
  border-top: 1px solid var(--color-text);
  border-bottom: 1px solid var(--color-text);
}

.list > li {
  padding: 0 var(--space-4);
}

.list-row {
  padding-left: 0;
  padding-right: 0;
}

.list-row-meta {
  font-family: var(--font-num);
  font-size: 0.8125rem;
}

.stock-qty {
  font-size: 1.375rem;
  font-weight: 400;
}

.empty-state {
  border: 1px dashed var(--color-text);
}

.btn-quiet {
  color: var(--color-text);
  text-decoration: underline;
}

.mainnav {
  border-top-color: var(--color-text);
}

.mainnav a {
  font-family: var(--font-num);
  font-size: 0.8125rem;
  text-transform: uppercase;
}

.mainnav a.active {
  color: var(--color-text);
  box-shadow: inset 0 0 0 1px var(--color-text);
}

.icon {
  stroke-width: 1.25px;
}

@media (min-width: 900px) {
  .topbar {
    grid-template-columns: 1fr;
    margin: var(--space-3);
  }

  .shell .topbar {
    border: 1px solid var(--color-text);
  }

  .brand {
    border-right: 0;
  }

  .topbar::after {
    padding: var(--space-2) var(--space-3);
    border-top: 1px solid var(--color-text);
  }

  .mainnav a.active {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--color-text);
  }
}
`,
})
