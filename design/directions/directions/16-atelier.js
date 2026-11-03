// 16 Atelier: the ceramics studio. One look-book direction: its palette,
// fonts, sources and the few rules that differ from the app's own components.
window.DIRECTIONS = window.DIRECTIONS || []
window.DIRECTIONS.push({
  num: 16,
  id: 'atelier',
  name: 'Atelier',
  family: 'Calm',
  dark: false,
  lang: 'en',
  line: 'Ceramics studio: oat and linen, soft rounded serif titles, charcoal glaze.',
  idea:
    'Warm like a ceramics studio or a good kitchen notebook: oat and linen tones, charcoal ink, ' +
    'and titles in a serif whose ends are softened, as if thrown on a wheel. ' +
    'Handmade in feel without any texture or illustration.',
  signature: 'Titles in Fraunces with its “soft” setting turned all the way up: serifs with rounded, clay-like ends.',
  fonts: [
    {
      family: 'Fraunces',
      role: 'titles and the main button',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Fraunces',
    },
    {
      family: 'Figtree',
      role: 'text and figures',
      licence: 'SIL OFL 1.1',
      url: 'https://fonts.google.com/specimen/Figtree',
    },
  ],
  gf: [
    'family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..700,0..100,0..1',
    'family=Figtree:ital,wght@0,400;0,500;0,600;0,700;1,400',
  ],
  inspiration: [
    {
      label: 'Heath Ceramics',
      url: 'https://www.heathceramics.com/',
      note: 'clay, glaze and table colours, with plain type',
    },
    {
      label: 'Fraunces',
      url: 'https://fonts.google.com/specimen/Fraunces',
      note: 'a “wonky” old-style serif whose SOFT axis rounds every corner',
    },
    {
      label: 'Minimal Gallery, food & drink',
      url: 'https://minimal.gallery/tag/food-drink/',
      note: 'craft food makers who keep the page simple and warm',
    },
  ],
  tokens: {
    '--color-bg': '#ebe3d4',
    '--color-surface': '#f8f4ec',
    '--color-sunken': '#e2d8c6',
    '--color-text': '#2a2622',
    '--color-text-muted': '#5a5248',
    '--color-border': '#d3c7b2',
    '--color-border-strong': '#8a7d68',
    '--color-focus': '#2d5aa0',
    '--color-accent': '#2f2b27',
    '--color-accent-hover': '#47413a',
    '--color-accent-soft': '#e4dccd',
    '--color-on-accent': '#f8f4ec',
    '--color-ok': '#1f6334',
    '--color-ok-soft': '#e3ecd9',
    '--color-warn': '#734600',
    '--color-warn-soft': '#f6e3b8',
    '--color-warn-border': '#c4861a',
    '--color-danger': '#9b2519',
    '--color-danger-soft': '#f5e0d8',
    '--font-body':
      "'Figtree', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--font-heading':
      "'Fraunces', 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', 'PingFang SC', 'Microsoft YaHei', serif",
    '--text-2xl': '2.25rem',
    '--weight-heading': '600',
    '--radius': '12px',
  },
  tweaks: `
/* Fraunces with its soft, clay-like ends */
h1,
h2,
.brand,
.btn-primary {
  font-variation-settings: 'SOFT' 100, 'WONK' 0;
}

.list {
  border: 0;
}

.empty-state {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.btn-primary {
  font-family: var(--font-heading);
  font-size: 1.25rem;
}

.btn-quiet {
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--color-border-strong);
}

.stock-qty {
  font-size: 1.375rem;
}

.topbar {
  background: var(--color-bg);
}

.brand {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
}

.mainnav a.active {
  color: var(--color-text);
  box-shadow: inset 0 3px 0 var(--color-text);
}

@media (min-width: 900px) {
  .mainnav a.active {
    background: var(--color-sunken);
    box-shadow: none;
  }
}
`,
})
