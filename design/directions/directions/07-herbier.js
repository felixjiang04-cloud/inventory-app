// 07 Herbier: the botanical plate. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 7,
  id: 'herbier',
  name: 'Herbier',
  family: 'Paper and print',
  dark: false,
  lang: 'en',
  line: 'Botanical plate: ivory paper, italic names, fine double-rule frames.',
  idea:
    'Takes its manners from old botanical plates: ivory paper, sepia ink, an old-style serif, item names in italic ' +
    'like specimen labels, and fine double-rule frames around each list. ' +
    'Quiet and literary, while the figures stay in tabular lining numerals.',
  signature: 'Item names in italic inside a fine double-rule frame, like an engraved plate.',
  fonts: [
    {
      family: 'EB Garamond',
      role: 'everything, with its small capitals',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/EB+Garamond',
    },
  ],
  gf: ['family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'],
  inspiration: [
    {
      label: 'Biodiversity Heritage Library',
      url: 'https://www.biodiversitylibrary.org/',
      note: 'centuries of botanical plates: frames, italic names, catalogue order',
    },
    {
      label: '150,000 illustrations made free',
      url: 'https://www.smithsonianmag.com/smart-news/over-150000-illustrations-wildlife-are-available-online-free-180974167/',
      note: 'the plates this direction borrows its manners from',
    },
    {
      label: 'EB Garamond',
      url: 'https://fonts.google.com/specimen/EB+Garamond',
      note: 'a Garamond revival with real small capitals and tabular figures',
    },
  ],
  tokens: {
    '--color-bg': '#f4efe3',
    '--color-surface': '#fbf8f1',
    '--color-sunken': '#ece5d5',
    '--color-text': '#2a2119',
    '--color-text-muted': '#5f5243',
    '--color-border': '#d8cdb6',
    '--color-border-strong': '#8a7a62',
    '--color-focus': '#2b55a8',
    '--color-accent': '#6b4a2b',
    '--color-accent-hover': '#52381f',
    '--color-accent-soft': '#efe5d4',
    '--color-on-accent': '#fbf8f1',
    '--color-ok': '#1f6334',
    '--color-ok-soft': '#e7eedc',
    '--color-warn': '#6e4800',
    '--color-warn-soft': '#f6dc9a',
    '--color-warn-border': '#c08a1a',
    '--color-danger': '#9a2a1c',
    '--color-danger-soft': '#f5e1d9',
    '--font-body':
      "'EB Garamond', 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif",
    '--text-sm': '1rem',
    '--text-md': '1.125rem',
    '--text-lg': '1.25rem',
    '--text-xl': '1.5rem',
    '--text-2xl': '2.25rem',
    '--weight-heading': '500',
    '--leading': '1.4',
    '--radius': '0px',
  },
  tweaks: `
h1 {
  font-weight: 400;
  letter-spacing: 0.01em;
}

h2 {
  font-size: var(--text-lg);
  font-variant-caps: all-small-caps;
  letter-spacing: 0.08em;
}

/* Lists framed by a fine double rule, like a plate */
.list {
  border: 3px double var(--color-border-strong);
}

.list-row-title {
  font-size: var(--text-lg);
  font-style: italic;
  font-weight: 500;
}

.list-row-meta {
  font-variant-caps: small-caps;
  letter-spacing: 0.03em;
}

.stock-qty {
  font-size: 1.5rem;
  font-weight: 500;
}

.empty-state {
  border: 1px solid var(--color-border-strong);
  outline: 1px solid var(--color-border-strong);
  outline-offset: 3px;
  font-style: italic;
}

.btn-primary {
  font-size: 1.25rem;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.06em;
}

/* "Needs checking" stands out from the sepia accent */
.badge-warn {
  border: 1px solid var(--color-warn-border);
}

.topbar {
  background: var(--color-bg);
  border-bottom: 3px double var(--color-border-strong);
}

.brand {
  font-size: var(--text-lg);
  font-style: italic;
  font-weight: 500;
}

.mainnav {
  background: var(--color-bg);
  border-top: 3px double var(--color-border-strong);
}

.mainnav a {
  font-size: 1rem;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.06em;
}

.mainnav a.active {
  box-shadow: none;
  text-decoration: underline;
  text-underline-offset: 5px;
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-sunken);
  }
}
`,
})
