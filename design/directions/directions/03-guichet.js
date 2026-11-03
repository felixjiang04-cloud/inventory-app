// 03 Guichet: public-service clarity. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 3,
  id: 'guichet',
  name: 'Guichet',
  family: 'Grid and system',
  dark: false,
  lang: 'en',
  line: 'Public-service plain: big bold type, hard-edged buttons, a thick focus ring.',
  idea:
    'Borrowed from the best government services: large bold headings, one obvious action, underlined links, ' +
    'and buttons with a hard bottom edge so they read as pressable. ' +
    'Everything is a size bigger than usual, which helps with wet hands and bad light.',
  signature: 'Buttons sit on a darker 3 px base, and keyboard focus is a thick black ring.',
  fonts: [
    {
      family: 'Public Sans',
      role: 'everything',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Public+Sans',
    },
  ],
  gf: ['family=Public+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400'],
  inspiration: [
    {
      label: 'GOV.UK Design System, button',
      url: 'https://design-system.service.gov.uk/components/button/',
      note: 'one obvious action, a hard bottom edge, a thick focus state',
    },
    {
      label: 'GOV.UK typography scale',
      url: 'https://designnotes.blog.gov.uk/2022/12/12/making-the-gov-uk-frontend-typography-scale-more-accessible/',
      note: 'type sized up so every service reads on every device',
    },
    {
      label: 'U.S. Web Design System',
      url: 'https://designsystem.digital.gov/',
      note: 'home of Public Sans, a plain, strong typeface for public services',
    },
  ],
  tokens: {
    '--color-bg': '#fbfaf8',
    '--color-surface': '#ffffff',
    '--color-sunken': '#f1efea',
    '--color-text': '#0d0d0c',
    '--color-text-muted': '#4f4b45',
    '--color-border': '#c9c4bb',
    '--color-border-strong': '#0d0d0c',
    '--color-focus': '#0d0d0c',
    '--color-accent': '#0b5a66',
    '--color-accent-hover': '#084550',
    '--color-accent-soft': '#e2f0f1',
    '--color-on-accent': '#ffffff',
    '--color-ok': '#2b6620',
    '--color-ok-soft': '#e9f2e3',
    '--color-warn': '#774700',
    '--color-warn-soft': '#fbefd6',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#a1241a',
    '--color-danger-soft': '#fbe8e5',
    '--font-body':
      "'Public Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--text-sm': '1rem',
    '--text-md': '1.125rem',
    '--text-lg': '1.25rem',
    '--text-xl': '1.5rem',
    '--text-2xl': '2.25rem',
    '--weight-strong': '700',
    '--weight-heading': '800',
    '--leading': '1.4',
    '--radius': '0px',
    '--tap': '3rem',
  },
  tweaks: `
/* Buttons stand on a hard, darker base */
.btn {
  margin-bottom: 3px;
  box-shadow: 0 3px 0 var(--color-text);
}

.btn-primary,
.btn-primary:hover {
  box-shadow: 0 3px 0 #052f36;
}

.btn-quiet,
.btn-quiet:hover {
  margin-bottom: 0;
  padding: 0;
  box-shadow: none;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.2em;
}

input {
  border-width: 2px;
}

:focus-visible,
.is-focus {
  outline: 4px solid var(--color-focus);
  outline-offset: 2px;
}

a:hover {
  text-decoration-thickness: 3px;
}

/* Lists read like a summary table: rules, no box */
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

.stock-qty {
  font-size: var(--text-xl);
}

.mainnav a {
  font-size: 0.875rem;
}

.mainnav a.active {
  color: var(--color-text);
  font-weight: 800;
  box-shadow: inset 0 5px 0 var(--color-accent);
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-accent-soft);
    box-shadow: inset 5px 0 0 var(--color-accent);
  }
}
`,
})
