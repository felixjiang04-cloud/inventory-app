// What the look book says around the mockups: the research it drew on and
// the shortlist for this app.
/* global window */

window.LOOKBOOK_SOURCES = [
  {
    label: 'Minimal Gallery, food & drink',
    url: 'https://minimal.gallery/tag/food-drink/',
    note: 'hand-picked minimal sites since 2013; food brands keep strict layouts and soft palettes.',
  },
  {
    label: 'Guidelines for Brutalist Web Design',
    url: 'https://brutalist-web.design/',
    note: 'underlined links, buttons that look like buttons, decoration only when needed.',
  },
  {
    label: 'GOV.UK Design System, button',
    url: 'https://design-system.service.gov.uk/components/button/',
    note: 'one obvious action, a hard bottom edge, a thick focus state.',
  },
  {
    label: 'Works in Progress',
    url: 'https://worksinprogress.co/',
    note: 'monospaced interface labels with serif headlines and plain rules.',
  },
  {
    label: 'Vitsœ, Good design',
    url: 'https://www.vitsoe.com/us/about/good-design',
    note: 'Dieter Rams’s “less, but better”: restraint as one decision held everywhere.',
  },
  {
    label: 'NYCTA Graphics Standards Manual',
    url: 'https://standardsmanual.com/',
    note: 'signs read in a glance: white on black, big type, nothing else.',
  },
  {
    label: 'Jock Kinneir and Margaret Calvert',
    url: 'https://designmuseum.org/design/jock-kinneir-margaret-calvert',
    note: 'mixed-case lettering tested for reading at speed.',
  },
  {
    label: 'Atkinson Hyperlegible',
    url: 'https://en.wikipedia.org/wiki/Atkinson_Hyperlegible',
    note: 'letters drawn so that 1, l and I, or B and 8, cannot be confused.',
  },
  {
    label: 'teenage engineering',
    url: 'https://teenage.engineering/',
    note: 'tiny labels and line pictograms; colour reserved for state.',
  },
  {
    label: 'St. JOHN',
    url: 'https://stjohnrestaurant.com/',
    note: 'a restaurant site in black serif capitals on white, with one engraving.',
  },
  {
    label: 'Septime',
    url: 'https://www.septime-charonne.fr/',
    note: 'typewriter labels, a wood-type mark and a lot of empty page.',
  },
  {
    label: 'Kinfolk',
    url: 'https://www.kinfolk.com/',
    note: 'a classic serif and generous white space.',
  },
  {
    label: 'Hamilton Wood Type & Printing Museum',
    url: 'https://woodtype.org/',
    note: 'wood-type figures and widely spaced capitals.',
  },
  {
    label: 'Herzog & de Meuron',
    url: 'https://www.herzogdemeuron.com/',
    note: 'an architecture office’s site: a mono search line, bare structure.',
  },
  {
    label: 'The concept of ma',
    url: 'https://www.newtarget.com/web-insights-blog/concept-of-ma/',
    note: 'empty space as an active part of the layout, not leftover.',
  },
  {
    label: 'Japanese users prefer dense, busy websites',
    url: 'https://boingboing.net/2026/01/05/japanese-users-prefer-dense-busy-websites.html',
    note: 'a warning: when minimal design makes everything look alike, people complain.',
  },
  {
    label: 'Typewolf',
    url: 'https://www.typewolf.com/',
    note: 'type pairings in real use.',
  },
]

// The three strongest for this app, best first (README.md has the longer reasoning).
window.LOOKBOOK_SHORTLIST = [
  {
    id: 'ticket',
    why:
      'Speaks the kitchen’s own language: cooks read order tickets all day. Monospaced figures line up by themselves, ' +
      'dashed tear lines separate items without boxes, and the black bump bar is impossible to miss. ' +
      'Distinctive with almost no decoration, and cheap to adopt.',
  },
  {
    id: 'signal',
    why:
      'The most legible in a hurry: a typeface drawn so characters can’t be confused, big mixed-case type, ' +
      'and black sign bands that tell you which screen you are on from arm’s length. Professional without looking like a template.',
  },
  {
    id: 'bistro',
    why:
      'The warmest and most restaurant-like, and its dotted leaders do real work: the eye runs from each item straight to its ' +
      'quantity or price. Reads naturally in French and stays clean in English and Chinese.',
  },
]
