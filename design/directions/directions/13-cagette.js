// 13 Cagette: the produce crate. One look-book direction: its palette, fonts,
// sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 13,
  id: 'cagette',
  name: 'Cagette',
  family: 'Kitchen',
  dark: false,
  lang: 'en',
  line: 'Produce crate: stencilled titles, a white tag on kraft.',
  idea:
    'Deliveries arrive in crates, so this direction borrows their look: kraft-brown card, ' +
    'titles stencilled like the print on a produce box, and plain white tags for the lists. ' +
    'Sturdy, warm and very readable.',
  signature: 'Stencil-cut titles and white tag lists on a kraft ground.',
  fonts: [
    {
      family: 'Big Shoulders Stencil Display',
      role: 'titles and the main button',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Big+Shoulders+Stencil+Display',
    },
    {
      family: 'Karla',
      role: 'text and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Karla',
    },
  ],
  gf: ['family=Big+Shoulders+Stencil+Display:wght@700;800', 'family=Karla:ital,wght@0,400;0,600;0,700;1,400'],
  inspiration: [
    {
      label: 'Stencil (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Stencil',
      note: 'letters with bridges, as sprayed on crates and sacks',
    },
    {
      label: 'Minimal Gallery, food & drink',
      url: 'https://minimal.gallery/tag/food-drink/',
      note: 'producers’ sites built on kraft, plain type and one bold mark',
    },
    {
      label: 'Big Shoulders',
      url: 'https://fonts.google.com/specimen/Big+Shoulders+Stencil+Display',
      note: 'a condensed family drawn from Chicago’s industrial lettering',
    },
  ],
  tokens: {
    '--color-bg': '#dcc9a6',
    '--color-surface': '#fffdf7',
    '--color-sunken': '#f1ead9',
    '--color-text': '#1b1712',
    '--color-text-muted': '#4a3f30',
    '--color-border': '#d9c9a8',
    '--color-border-strong': '#6f6047',
    '--color-focus': '#173f9e',
    '--color-accent': '#1b1712',
    '--color-accent-hover': '#3a3227',
    '--color-accent-soft': '#efe4cd',
    '--color-on-accent': '#fffdf7',
    '--color-ok': '#1d6132',
    '--color-ok-soft': '#e3eedb',
    '--color-warn': '#6e4800',
    '--color-warn-soft': '#f6dc9a',
    '--color-warn-border': '#b07d12',
    '--color-danger': '#9a2417',
    '--color-danger-soft': '#f8e1da',
    '--font-body':
      "'Karla', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-heading':
      "'Big Shoulders Stencil Display', 'Saira Stencil One', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif",
    '--text-xl': '1.75rem',
    '--text-2xl': '2.75rem',
    '--weight-heading': '800',
    '--radius': '3px',
  },
  tweaks: `
h1,
h2 {
  line-height: 0.95;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.list {
  border: 0;
}

.empty-state {
  background: var(--color-surface);
  border: 2px dashed var(--color-text);
  color: var(--color-text);
}

.btn-primary {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.btn-quiet {
  text-decoration: underline;
}

.num {
  font-size: 1.0625rem;
  font-weight: 700;
}

.list-row-meta.num {
  font-weight: 400;
}

.stock-qty {
  font-size: 1.5rem;
}

.badge-warn {
  border: 1px solid var(--color-warn-border);
}

.topbar {
  background: var(--color-bg);
  border-bottom: 2px solid var(--color-text);
}

.brand {
  font-family: var(--font-heading);
  font-size: 1.375rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mainnav {
  border-top: 2px solid var(--color-text);
}

.mainnav a.active {
  color: var(--color-text);
  font-weight: 700;
  box-shadow: inset 0 5px 0 var(--color-text);
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-sunken);
    box-shadow: inset 5px 0 0 var(--color-text);
  }
}
`,
})
