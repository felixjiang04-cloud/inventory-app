// 10 Ticket: the kitchen order ticket. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 10,
  id: 'ticket',
  name: 'Ticket',
  family: 'Kitchen',
  dark: false,
  lang: 'en',
  line: 'Order tickets from the pass: mono type, dashed tear lines, a black bump bar.',
  idea:
    'Uses the visual language every cook already reads at speed: the thermal order ticket. ' +
    'Monospaced type, uppercase headers, dashed tear lines between items and white paper strips on a counter-grey ground. ' +
    'The main button is a solid black bar, like the bump bar on a kitchen screen.',
  signature: 'Lists printed as white ticket strips with dashed tear lines, on a counter-grey ground.',
  fonts: [
    {
      family: 'JetBrains Mono',
      role: 'everything',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/JetBrains+Mono',
    },
  ],
  gf: ['family=JetBrains+Mono:ital,wght@0,400;0,600;0,800;1,400'],
  inspiration: [
    {
      label: 'Thermal printers in a kitchen (Star Micronics)',
      url: 'https://star-emea.com/wp-content/uploads/2023/10/Thermal-receipt-printers-in-a-kitchen-environment-1.pdf',
      note: 'the ticket printer at the pass, and why kitchens chose it',
    },
    {
      label: 'Septime',
      url: 'https://www.septime-charonne.fr/',
      note: 'typewriter labels on an otherwise empty page',
    },
    {
      label: 'JetBrains Mono',
      url: 'https://fonts.google.com/specimen/JetBrains+Mono',
      note: 'a monospace drawn for long reading, with clear 0/O and 1/l',
    },
  ],
  tokens: {
    '--color-bg': '#dedcd6',
    '--color-surface': '#fffefb',
    '--color-sunken': '#f1efea',
    '--color-text': '#121211',
    '--color-text-muted': '#4a4741',
    '--color-border': '#8a867e',
    '--color-border-strong': '#121211',
    '--color-focus': '#1d55c4',
    '--color-accent': '#121211',
    '--color-accent-hover': '#34322e',
    '--color-accent-soft': '#e9e7e1',
    '--color-on-accent': '#fffefb',
    '--color-ok': '#1b6a37',
    '--color-ok-soft': '#e6f1e8',
    '--color-warn': '#774700',
    '--color-warn-soft': '#f9ecd0',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#a1241a',
    '--color-danger-soft': '#fae6e2',
    '--font-body':
      "'JetBrains Mono', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', ui-monospace, monospace",
    '--text-lg': '1.125rem',
    '--text-xl': '0.875rem',
    '--text-2xl': '1.5rem',
    '--weight-heading': '800',
    '--leading': '1.5',
    '--radius': '0px',
  },
  tweaks: `
h1,
h2 {
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Lists are ticket strips: white paper between dashed tear lines */
.list {
  border: 0;
  border-top: 2px dashed var(--color-text);
  border-bottom: 2px dashed var(--color-text);
}

.list > li + li {
  border-top-style: dashed;
}

.list-row-title {
  text-transform: uppercase;
}

.num {
  font-weight: 600;
}

.stock-qty {
  font-size: 1.375rem;
  font-weight: 800;
}

.empty-state {
  background: var(--color-surface);
  border: 0;
  border-top: 2px dashed var(--color-text);
  border-bottom: 2px dashed var(--color-text);
  color: var(--color-text);
}

/* The bump bar */
.btn-primary {
  min-height: 3.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.btn-quiet {
  color: var(--color-text);
  text-decoration: underline;
  text-transform: uppercase;
}

input {
  border-width: 2px;
}

.topbar {
  background: var(--color-bg);
  border-bottom: 2px solid var(--color-text);
}

.brand {
  font-size: var(--text-sm);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mainnav {
  border-top: 2px dashed var(--color-text);
}

.mainnav a {
  font-size: 0.75rem;
  text-transform: uppercase;
}

.mainnav a.active {
  color: var(--color-text);
  font-weight: 800;
  box-shadow: inset 0 -5px 0 var(--color-text);
}

@media (min-width: 900px) {
  .mainnav a {
    font-size: var(--text-sm);
  }

  .mainnav a.active {
    background: var(--color-sunken);
    box-shadow: inset 5px 0 0 var(--color-text);
  }
}
`,
})
