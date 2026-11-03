// 20 Console: the appliance panel. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 20,
  id: 'console',
  name: 'Console',
  family: 'Dark',
  dark: true,
  lang: 'en',
  line: 'Appliance panel: graphite, small printed labels over values, key-like buttons.',
  idea:
    'Takes its cues from well-made kitchen equipment and music hardware: a graphite panel, small uppercase labels ' +
    'printed above each value, and buttons that look like physical keys. ' +
    'Colour is kept for state, the way an appliance only lights up what is on.',
  signature: 'Small uppercase labels printed above each value, like the markings on a control panel.',
  fonts: [
    {
      family: 'Chivo',
      role: 'text and titles',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Chivo',
    },
    {
      family: 'Chivo Mono',
      role: 'labels and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Chivo+Mono',
    },
  ],
  gf: ['family=Chivo:ital,wght@0,400;0,500;0,700;0,800;1,400', 'family=Chivo+Mono:wght@400;500;600'],
  inspiration: [
    {
      label: 'teenage engineering',
      url: 'https://teenage.engineering/',
      note: 'small printed labels and line pictograms; colour only for state',
    },
    {
      label: 'Vitsœ, Good design',
      url: 'https://www.vitsoe.com/us/about/good-design',
      note: 'Dieter Rams’s rules for objects that explain themselves',
    },
    {
      label: 'Chivo',
      url: 'https://fonts.google.com/specimen/Chivo',
      note: 'a grotesk with a matching mono, for labels that sit with the text',
    },
  ],
  tokens: {
    '--color-bg': '#1e1d1b',
    '--color-surface': '#282724',
    '--color-sunken': '#32302d',
    '--color-text': '#f0eee9',
    '--color-text-muted': '#a9a59d',
    '--color-border': '#3e3c38',
    '--color-border-strong': '#8b877f',
    '--color-focus': '#f0eee9',
    '--color-accent': '#e9e6df',
    '--color-accent-hover': '#ffffff',
    '--color-accent-soft': '#3a3834',
    '--color-on-accent': '#1e1d1b',
    '--color-ok': '#8fd3a0',
    '--color-ok-soft': '#1f3326',
    '--color-warn': '#f2c46d',
    '--color-warn-soft': '#3a2e17',
    '--color-warn-border': '#c99a3e',
    '--color-danger': '#f5a197',
    '--color-danger-soft': '#3d1f1b',
    '--font-body':
      "'Chivo', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-num':
      "'Chivo Mono', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', ui-monospace, monospace",
    '--weight-heading': '800',
    '--radius': '8px',
  },
  tweaks: `
:root {
  color-scheme: dark;
}

/* Labels printed above the values (needs data-label="…" on the quantity) */
.stock-qty::before {
  content: attr(data-label);
  display: block;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  letter-spacing: -0.01em;
}

h2 {
  font-family: var(--font-num);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.list-row-title {
  font-weight: 500;
}

.num {
  font-size: 1.125rem;
}

.stock-qty {
  font-size: 1.5rem;
  font-weight: 500;
}

/* Buttons like physical keys: a darker lower edge */
.btn {
  background: var(--color-sunken);
  border-color: var(--color-border-strong);
  border-bottom: 3px solid #11100f;
}

.btn-primary,
.btn-primary:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
  border-bottom-color: #9d998f;
  color: var(--color-on-accent);
  font-weight: 700;
}

.btn-quiet,
.btn-quiet:hover {
  border: 0;
  background: transparent;
  color: var(--color-text);
  text-decoration: underline;
}

.empty-state {
  border-color: var(--color-border-strong);
}

.topbar {
  background: var(--color-bg);
}

.brand {
  font-family: var(--font-num);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.mainnav {
  background: var(--color-bg);
}

.mainnav a {
  font-family: var(--font-num);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* The current tab is lit, like an indicator */
.mainnav a.active {
  color: var(--color-text);
  box-shadow: none;
}

.mainnav a.active::before {
  content: '';
  width: 6px;
  height: 6px;
  margin-bottom: 2px;
  background: var(--color-text);
  border-radius: 1px;
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-sunken);
  }

  .mainnav a.active::before {
    margin: 0;
  }
}
`,
})
