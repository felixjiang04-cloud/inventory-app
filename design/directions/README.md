# Inventory Look Book: 20 design directions

Twenty alternative looks for the app, each shown on the same screens with the
same data: Home ("To do") and Stock on a phone, Stock on a computer with the
sidebar, and a strip of states (needs checking, confirmed, error, keyboard
focus). Every direction can be switched between English, French and Chinese.

Nothing here changes the app. These are mockups for choosing a direction.

## Looking at it

- **Published:** a private Artifact,
  <https://claude.ai/artifact/FUQ87nro4KkyBB6iwXuhDr> (only you can open it
  until you share it from its Share menu).
- **On this computer:** start `design-gallery` from `.claude/launch.json`
  (or run `python -m http.server 5180 --directory design/directions`), then
  open <http://localhost:5180/preview.html>. Opening the file directly from
  disk does not work, because the browser won't load the scripts beside it.

## How it is built

| File | What it holds |
|---|---|
| `mockup.css` | A copy of the app's own `base.css`, `components.css` and `shell.css` rules for these screens, scoped to `.mock`. The defaults are today's tokens. |
| `directions/NN-name.js` | One file per direction: name, idea, fonts, inspiration links, **tokens** (same names as `frontend/src/styles/tokens.css`) and **tweaks** (plain CSS on the app's class names). |
| `strings.js` | EN/FR/ZH text copied from `frontend/src/i18n/*.json`, the sample data, and the same `Intl` date/money formats as `frontend/src/format.ts`. |
| `gallery.js`, `gallery.css` | The look book page itself: contact sheet, detail view, contrast table, measured checks. |
| `notes.js` | Research sources and the shortlist. |
| `index.html` | The page as published (the Artifact host adds `<html>`, `<head>`, `<body>`). |
| `preview.html` | The same page as a complete document, for local viewing. Keep its script list in step with `index.html`. |

Because each mockup runs on a copy of the app's real CSS, a direction really
is "new token values plus a short list of tweaks". The page measures, rather
than assumes, four things for every direction: WCAG AA contrast for every
text/background pair, tabular figures in the fonts used for money and
quantities, tap targets of at least 44 px, and no sideways scrolling on a
360 px phone in all three languages. All 20 pass. (Two fonts first chosen,
Albert Sans and Libre Franklin, failed the tabular-figures test and were
replaced by Schibsted Grotesk and Jost.)

## Adopting a direction

1. Open the direction and copy its **Tokens** block over the values in
   `frontend/src/styles/tokens.css`.
2. If the block has tokens marked `/* new */`, add them and use them in
   `base.css`: headings take `--font-heading`, `--weight-heading` and
   `--tracking-heading`; `.num` takes `--font-num`; borders take `--rule`.
3. Paste its **Component tweaks** into `components.css` / `shell.css`.
4. Bundle the fonts the way Source Sans 3 is bundled today
   (`@fontsource/...` packages), so the app still makes no request to Google.
5. Three tweaks need a small markup hook:
   - Plan shows the screen name in the top bar from `data-screen` on `<header class="topbar">`.
   - Console prints a label above the quantity from `data-label` on `.stock-qty`.
   - Directions that recolour the logo need it inline (an `<svg>` with classes) instead of `<img src="/favicon.svg">`.

## Two things worth fixing in today's app, whichever look wins

- **Input borders are too faint.** `--color-border-strong` (`#b5ad9f`) on white
  is 2.2:1; WCAG asks 3:1 for the outline that shows where a field is. Every
  direction here uses a darker value.
- **"All invoices added to stock" is a small target.** It is a plain text link,
  about 20 px tall. `mockup.css` gives it the full 44 px height (`.after-list a`).

## Shortlist

1. **10 Ticket.** Speaks the kitchen's own language: cooks read order tickets
   all day. Monospaced figures line up by themselves, dashed tear lines
   separate items without boxes, and the black bump bar is impossible to miss.
   Distinctive with almost no decoration, and cheap to adopt.
2. **04 Signal.** The most legible in a hurry: Atkinson Hyperlegible (drawn so
   characters can't be confused), big mixed-case type, and black sign bands that
   tell you which screen you are on from arm's length.
3. **11 Bistro.** The warmest and most restaurant-like, and its dotted leaders
   do real work: the eye runs from each item to its quantity or price. Reads
   naturally in French and stays clean in English and Chinese.

Close behind: **06 Grand livre** (the ledger look fits what the app does
underneath, but feels more back office) and **01 Raster** (the cleanest, but
closest to today's look). Parts also combine well, for example Signal's sign
bands with Ticket's monospaced figures.

## The twenty

| # | Name | Idea | Fonts |
|---|---|---|---|
| 01 | Raster | Swiss grid: flush-left type, hairlines, figures set large | Archivo |
| 02 | Béton | Restrained brutalism: 2 px black frames, mono labels | IBM Plex Sans + Mono |
| 03 | Guichet | Public-service plain: big bold type, hard-edged buttons | Public Sans |
| 04 | Signal | Station signage: white-on-black bands, arrows | Atkinson Hyperlegible Next |
| 05 | Feuilleton | Magazine page: serif headlines, mono details | Newsreader + DM Mono |
| 06 | Grand livre | Ledger: ruled money column, double rules | Spectral + Courier Prime |
| 07 | Herbier | Botanical plate: italic names, double-rule frames | EB Garamond |
| 08 | Casse | Wood type: heavy slab figures, thick-thin rules | Zilla Slab + Work Sans |
| 09 | Riso | Black and white plus one fluorescent pink | Familjen Grotesk |
| 10 | Ticket | Kitchen order tickets: mono, dashed tear lines | JetBrains Mono |
| 11 | Bistro | Menu card: dotted leaders, enamel plaque titles (shown in French) | Bodoni Moda + Jost |
| 12 | Pâtisserie | Pale rose and cocoa, fine double lines | Gilda Display + Nunito Sans |
| 13 | Cagette | Produce crate: stencilled titles on kraft | Big Shoulders Stencil + Karla |
| 14 | Sumi | Paper and ink; vertical titles in Chinese (shown in Chinese) | Noto Serif + Noto Sans |
| 15 | Nordisk | Scandinavian air: dusty blue, soft corners | Schibsted Grotesk |
| 16 | Atelier | Ceramics studio: soft rounded serif titles | Fraunces + Figtree |
| 17 | Plan | Architect's sheet: title block, construction lines | Hanken Grotesk + Spline Sans Mono |
| 18 | Service de nuit | Dark, low glare, one pale-blue pilot light | Red Hat Display + Text |
| 19 | Ardoise | Dark slate board: condensed capitals, big figures | Barlow Condensed + Barlow |
| 20 | Console | Dark appliance panel: printed labels, key-like buttons | Chivo + Chivo Mono |

All fonts are SIL Open Font License. Chinese always uses the phone's own font
(PingFang SC, Microsoft YaHei, Noto Sans CJK SC).

Rules every direction follows (from `docs/design-guidelines.md`): no
gradients, glows, glass, blobs or emoji; green, amber and red only for meaning;
warm neutral greys; one accent; icons only in the tab bar; tabular figures for
money and quantities; 44 px tap targets; visible focus.

## Research

Principles were borrowed, never a site's identity:
[Minimal Gallery](https://minimal.gallery/tag/food-drink/) ·
[Guidelines for Brutalist Web Design](https://brutalist-web.design/) ·
[GOV.UK Design System](https://design-system.service.gov.uk/components/button/) ·
[Works in Progress](https://worksinprogress.co/) ·
[Vitsœ, Good design](https://www.vitsoe.com/us/about/good-design) ·
[NYCTA Graphics Standards Manual](https://standardsmanual.com/) ·
[Kinneir and Calvert](https://designmuseum.org/design/jock-kinneir-margaret-calvert) ·
[Atkinson Hyperlegible](https://en.wikipedia.org/wiki/Atkinson_Hyperlegible) ·
[teenage engineering](https://teenage.engineering/) ·
[St. JOHN](https://stjohnrestaurant.com/) ·
[Septime](https://www.septime-charonne.fr/) ·
[Kinfolk](https://www.kinfolk.com/) ·
[Hamilton Wood Type Museum](https://woodtype.org/) ·
[Herzog & de Meuron](https://www.herzogdemeuron.com/) ·
[The concept of ma](https://www.newtarget.com/web-insights-blog/concept-of-ma/) ·
[Boing Boing on dense Japanese sites](https://boingboing.net/2026/01/05/japanese-users-prefer-dense-busy-websites.html) ·
[Typewolf](https://www.typewolf.com/).
Each direction lists its own sources in the look book.
