// 18 Service de nuit: low glare for late service. One look-book direction: its
// palette, fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 18,
  id: 'nuit',
  name: 'Service de nuit',
  family: 'Dark',
  dark: true,
  lang: 'en',
  line: 'Low glare for late service: warm charcoal, soft off-white, one pale-blue pilot light.',
  idea:
    'For the last hours of service and dim stations: warm charcoal instead of black, soft off-white text instead of pure white, ' +
    'and a single pale-blue accent like a burner’s pilot light. Nothing glows; it simply glares less.',
  signature: 'One pale-blue “pilot light” for the main action and the current tab, and colour nowhere else.',
  fonts: [
    {
      family: 'Red Hat Display',
      role: 'titles',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Red+Hat+Display',
    },
    {
      family: 'Red Hat Text',
      role: 'text and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Red+Hat+Text',
    },
  ],
  gf: ['family=Red+Hat+Display:wght@500;600;700', 'family=Red+Hat+Text:ital,wght@0,400;0,500;0,600;1,400'],
  inspiration: [
    {
      label: 'Stripe Press',
      url: 'https://press.stripe.com/',
      note: 'a warm near-black ground instead of pure black',
    },
    {
      label: 'Are.na',
      url: 'https://www.are.na/',
      note: 'a dark page that stays plain: text, lists, two buttons',
    },
    {
      label: 'Red Hat fonts',
      url: 'https://fonts.google.com/specimen/Red+Hat+Text',
      note: 'a text cut built for small sizes and a display cut for titles',
    },
  ],
  tokens: {
    '--color-bg': '#1c1a17',
    '--color-surface': '#262420',
    '--color-sunken': '#302d28',
    '--color-text': '#ece7de',
    '--color-text-muted': '#aea79b',
    '--color-border': '#3d3a34',
    '--color-border-strong': '#8a8378',
    '--color-focus': '#9cc7f0',
    '--color-accent': '#9cc7f0',
    '--color-accent-hover': '#b9d8f5',
    '--color-accent-soft': '#2b333d',
    '--color-on-accent': '#1c1a17',
    '--color-ok': '#8fd3a0',
    '--color-ok-soft': '#1f3326',
    '--color-warn': '#f2c46d',
    '--color-warn-soft': '#3a2e17',
    '--color-warn-border': '#c99a3e',
    '--color-danger': '#f5a197',
    '--color-danger-soft': '#3d1f1b',
    '--font-body':
      "'Red Hat Text', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-heading':
      "'Red Hat Display', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--weight-heading': '600',
    '--radius': '8px',
  },
  tweaks: `
:root {
  color-scheme: dark;
}

.stock-qty {
  font-size: 1.375rem;
}

.topbar {
  background: var(--color-bg);
}

.mainnav {
  background: var(--color-bg);
}
`,
})
