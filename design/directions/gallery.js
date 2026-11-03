// The look book: all twenty directions as a contact sheet, and one direction
// at a time in detail (#raster, #ticket, ...). Display code only; each
// direction's colours, fonts and tweaks live in directions/*.js.
/* global window, document, location, ResizeObserver */
;(function () {
  const DIRS = window.DIRECTIONS.sort((a, b) => a.num - b.num)
  const S = window.MOCK_STRINGS
  const DATA = window.MOCK_DATA
  const F = window.MOCK_FORMAT
  const ICONS = window.MOCK_ICONS
  const app = document.getElementById('lookbook')

  const LANGS = { en: 'English', fr: 'Français', zh: '中文' }

  // The three directions recommended for this app, with the reason.
  const SHORTLIST = window.LOOKBOOK_SHORTLIST || []

  // Today's tokens.css, so a direction's block can be shown complete.
  const TODAY = {
    '--color-bg': '#f6f4ef',
    '--color-surface': '#ffffff',
    '--color-sunken': '#efece5',
    '--color-text': '#1d1b18',
    '--color-text-muted': '#5e584f',
    '--color-border': '#dcd6cb',
    '--color-border-strong': '#b5ad9f',
    '--color-focus': '#3d7cc0',
    '--color-accent': '#1f4e79',
    '--color-accent-hover': '#163b5c',
    '--color-accent-soft': '#e5edf5',
    '--color-on-accent': '#ffffff',
    '--color-ok': '#1d6a39',
    '--color-ok-soft': '#e7f2ea',
    '--color-warn': '#7d4c00',
    '--color-warn-soft': '#fcf1dc',
    '--color-warn-border': '#d4962a',
    '--color-danger': '#a3261a',
    '--color-danger-soft': '#fbeae8',
    '--font-body':
      "'Source Sans 3 Variable', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
    '--text-sm': '0.875rem',
    '--text-md': '1rem',
    '--text-lg': '1.125rem',
    '--text-xl': '1.375rem',
    '--text-2xl': '1.75rem',
    '--weight-strong': '600',
    '--leading': '1.45',
    '--space-1': '0.25rem',
    '--space-2': '0.5rem',
    '--space-3': '0.75rem',
    '--space-4': '1rem',
    '--space-5': '1.5rem',
    '--space-6': '2rem',
    '--space-7': '3rem',
    '--radius': '6px',
    '--tap': '2.75rem',
    '--content-width': '46rem',
    '--sidebar-width': '14rem',
    '--tabbar-height': '4.25rem',
  }
  const NEW_TOKENS = {
    '--font-heading': 'var(--font-body)',
    '--font-num': 'var(--font-body)',
    '--weight-heading': 'var(--weight-strong)',
    '--tracking-heading': 'normal',
    '--rule': '1px',
    '--brand-tile': 'var(--color-accent)',
    '--brand-paper': 'var(--color-on-accent)',
  }

  // Text/background pairs every direction must pass (WCAG AA: 4.5:1 for
  // text, 3:1 for input borders and the focus ring).
  const PAIRS = [
    ['Text on background', '--color-text', '--color-bg', 4.5],
    ['Text on surface', '--color-text', '--color-surface', 4.5],
    ['Muted text on background', '--color-text-muted', '--color-bg', 4.5],
    ['Muted text on surface', '--color-text-muted', '--color-surface', 4.5],
    ['Button text on accent', '--color-on-accent', '--color-accent', 4.5],
    ['Links on surface', '--color-accent', '--color-surface', 4.5, 'links'],
    ['Links on background', '--color-accent', '--color-bg', 4.5, 'links'],
    ['Needs checking', '--color-warn', '--color-warn-soft', 4.5],
    ['Confirmed', '--color-ok', '--color-ok-soft', 4.5],
    ['Error', '--color-danger', '--color-danger-soft', 4.5],
    ['Input border on surface', '--color-border-strong', '--color-surface', 3],
    ['Focus ring on background', '--color-focus', '--color-bg', 3],
  ]

  const SWATCHES = [
    ['--color-bg', 'background'],
    ['--color-surface', 'surface'],
    ['--color-text', 'text'],
    ['--color-text-muted', 'muted'],
    ['--color-accent', 'accent'],
    ['--color-ok', 'confirmed'],
    ['--color-warn', 'needs checking'],
    ['--color-danger', 'error'],
  ]

  // --- small helpers -------------------------------------------------------

  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    )
  const fill = (template, values) => template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key])
  const pad = (n) => String(n).padStart(2, '0')
  const store = {
    get(key, fallback) {
      try {
        return window.localStorage.getItem(key) || fallback
      } catch {
        return fallback
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value)
      } catch {
        /* private window: the choice just isn't remembered */
      }
    },
  }

  function colourOf(dir, nameOrHex) {
    if (nameOrHex.startsWith('#')) return nameOrHex
    return dir.tokens[nameOrHex] || TODAY[nameOrHex]
  }

  function luminance(hex) {
    const n = hex.replace('#', '')
    const full = n.length === 3 ? n.replace(/./g, '$&$&') : n
    const [r, g, b] = [0, 2, 4].map((i) => {
      const c = parseInt(full.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  function contrast(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  function contrastRows(dir) {
    const pairs = PAIRS.filter((p) => !(p[4] === 'links' && dir.linksUseText)).concat(
      dir.extraPairs || [],
    )
    return pairs.map(([label, fg, bg, min]) => {
      const ratio = contrast(colourOf(dir, fg), colourOf(dir, bg))
      return { label, fg: colourOf(dir, fg), bg: colourOf(dir, bg), ratio, min, pass: ratio >= min }
    })
  }

  // --- styles: one scoped block per direction ------------------------------

  function scopedCss(dir) {
    const tokens = Object.entries(dir.tokens)
      .map(([name, value]) => `  ${name}: ${value};`)
      .join('\n')
    const tweaks = (dir.tweaks || '')
      .replace(/@media \(min-width: 900px\)/g, '@container (min-width: 900px)')
      .replace(/:root/g, '&')
    return `.mock.dir-${dir.id} {\n${tokens}\n${tweaks}\n}`
  }

  function installStyles() {
    const style = document.createElement('style')
    style.textContent = DIRS.map(scopedCss).join('\n\n')
    document.head.appendChild(style)

    // One font request per direction, so a single bad family can't block the rest.
    const families = [['family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400', 'family=Source+Code+Pro:wght@400;600']]
      .concat(DIRS.map((d) => d.gf))
    families.forEach((list) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?${list.join('&')}&display=swap`
      document.head.appendChild(link)
    })
  }

  // --- the mocked-up screens ----------------------------------------------

  function navHtml(t, active) {
    return ['home', 'add', 'check', 'stock', 'more']
      .map((key) => {
        const on = key === active
        return (
          `<a href="#"${on ? ' class="active" aria-current="page"' : ''}>` +
          '<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" ' +
          `stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key]}</svg>` +
          `${esc(t.nav[key])}</a>`
        )
      })
      .join('')
  }

  function homeHtml(t, lang) {
    const rows = DATA.recent
      .map(
        (r) =>
          '<li><a class="list-row" href="#"><span class="list-row-main">' +
          `<span class="list-row-title">${esc(r.supplier)}</span>` +
          `<span class="list-row-meta">${esc(F.date(r.date, lang))}</span></span>` +
          `<span class="num">${esc(F.money(r.cents, lang))}</span></a></li>`,
      )
      .join('')
    return (
      '<div class="page">' +
      `<h1>${esc(t.home.title)}</h1>` +
      '<div class="home-actions">' +
      `<a class="btn btn-primary btn-large btn-block" href="#">${esc(t.home.addInvoice)}</a>` +
      `<a class="btn btn-quiet" href="#">${esc(t.home.typeInstead)}</a></div>` +
      `<div class="empty-state"><p>${esc(t.home.allClear)}</p></div>` +
      `<h2>${esc(t.home.recent)}</h2>` +
      `<ul class="list">${rows}</ul>` +
      `<p class="after-list"><a href="#">${esc(t.home.seeAllPosted)}</a></p></div>`
    )
  }

  function stockHtml(t, lang, uid) {
    const rows = DATA.stock
      .map(
        (r) =>
          '<li><div class="list-row"><span class="list-row-main">' +
          `<span class="list-row-title">${esc(r.name)}</span>` +
          `<span class="list-row-meta">${esc(fill(t.stock.lastDelivery, { date: F.date(r.lastDelivery, lang) }))}</span></span>` +
          '<span class="list-row-end">' +
          `<span class="num stock-qty" data-label="${esc(t.quantity)}">${esc(F.qty(r.qty, r.unit, lang))}</span>` +
          `<span class="num list-row-meta">${esc(fill(t.stock.spent, { amount: F.money(r.spentCents, lang) }))}</span>` +
          '</span></div></li>',
      )
      .join('')
    return (
      '<div class="page">' +
      `<h1>${esc(t.stock.title)}</h1>` +
      '<div class="field">' +
      `<label for="search-${uid}" class="sr-only">${esc(t.stock.search)}</label>` +
      `<input id="search-${uid}" type="search" placeholder="${esc(t.stock.search)}"></div>` +
      `<ul class="list">${rows}</ul></div>`
    )
  }

  // Invoices to check, as frontend/src/pages/ReviewQueue.tsx draws it
  function queueHtml(t, lang) {
    const rows = DATA.queue
      .map(
        (r) =>
          '<li><a class="list-row" href="#"><span class="list-row-main">' +
          `<span class="list-row-title">${esc(r.supplier)}</span>` +
          `<span class="list-row-meta">${esc(F.date(r.date, lang))} · ${esc(r.number)}</span></span>` +
          '<span class="list-row-end">' +
          `<span class="num">${esc(F.money(r.cents, lang))}</span>` +
          (r.unconfirmed > 0
            ? `<span class="badge badge-warn">${esc(fill(t.review.toConfirm, { count: r.unconfirmed }))}</span>`
            : `<span class="badge badge-ok">${esc(t.review.readyToAdd)}</span>`) +
          '</span></a></li>',
      )
      .join('')
    return (
      '<div class="page">' +
      `<div class="page-header"><h1>${esc(t.review.title)}</h1></div>` +
      `<ul class="list">${rows}</ul></div>`
    )
  }

  // Each screen: its title (for the top bar), its tab, and its page.
  const SCREENS = {
    home: { title: (t) => t.home.title, tab: 'home', page: (t, lang) => homeHtml(t, lang) },
    stock: { title: (t) => t.stock.title, tab: 'stock', page: (t, lang, uid) => stockHtml(t, lang, uid) },
    queue: { title: (t) => t.review.title, tab: 'check', page: (t, lang) => queueHtml(t, lang) },
  }

  function screenHtml(dir, lang, screen, uid) {
    const t = S[lang]
    const s = SCREENS[screen]
    return (
      `<div class="mock dir-${dir.id}" lang="${lang}"><div class="shell">` +
      `<header class="topbar" data-screen="${esc(s.title(t))}">` +
      `<a class="brand" href="#">${window.MOCK_BRAND_MARK}${esc(t.appTitle)}</a></header>` +
      `<nav class="mainnav" aria-label="${esc(t.nav.main)}">${navHtml(t, s.tab)}</nav>` +
      `<main class="content">${s.page(t, lang, uid)}</main>` +
      '</div></div>'
    )
  }

  function statesHtml(dir, lang) {
    const t = S[lang]
    return (
      `<div class="mock dir-${dir.id}" lang="${lang}"><div class="page">` +
      '<ul class="list"><li><a class="list-row" href="#"><span class="list-row-main">' +
      `<span class="list-row-title">${esc(fill(t.home.invoicesToCheck, { count: 2 }))}</span>` +
      `<span class="list-row-meta">${esc(t.home.invoicesToCheckHint)}</span></span>` +
      '<span class="badge badge-warn">2</span></a></li></ul>' +
      `<div class="notice notice-ok" style="margin-top: var(--space-4)"><p>${esc(t.allConfirmed)}</p></div>` +
      `<div class="notice notice-error"><p>${esc(t.network)}</p></div>` +
      `<a class="btn btn-primary btn-block is-focus states-focus" href="#">${esc(t.home.addInvoice)}</a>` +
      '</div></div>'
    )
  }

  const FRAMES = { phone: [390, 780], desktop: [1180, 600], states: [390, 0] }

  // A frame is drawn at its real size, then scaled to fit its box.
  function frameHtml(kind, inner, max = 1) {
    const [w, h] = FRAMES[kind]
    const size = `width:${w}px;${h ? `height:${h}px;` : ''}`
    return (
      `<div class="frame-box frame-box-${kind}" data-w="${w}" data-h="${h}" data-max="${max}">` +
      `<div class="frame frame-${kind}" style="${size}">${inner}</div></div>`
    )
  }

  function fit(box) {
    const frame = box.firstElementChild
    const scale = Math.min(Number(box.dataset.max), box.clientWidth / Number(box.dataset.w))
    frame.style.transform = `scale(${scale})`
    const height = Number(box.dataset.h) || frame.offsetHeight
    box.style.height = `${Math.ceil(height * scale)}px`
  }

  const resizer = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)))
  function fitAll(root) {
    root.querySelectorAll('.frame-box').forEach((box) => {
      fit(box)
      resizer.observe(box)
    })
  }

  // --- checks measured in the page ----------------------------------------

  function measure(dir) {
    // Tabular figures: in a font with tabular figures "1111" and "0000" are
    // the same width.
    const probe = document.createElement('div')
    probe.className = `mock dir-${dir.id} probe`
    probe.innerHTML =
      '<span class="num">1111111111</span><span class="num">0000000000</span>' +
      '<span class="num stock-qty">1111111111</span><span class="num stock-qty">0000000000</span>'
    document.body.appendChild(probe)
    const w = [...probe.children].map((s) => s.getBoundingClientRect().width)
    const tabular = Math.abs(w[0] - w[1]) < 0.5 && Math.abs(w[2] - w[3]) < 0.5
    probe.remove()

    // Tap targets and sideways scrolling, on a small 360 px phone, in all
    // three languages.
    const lab = document.createElement('div')
    lab.className = 'lab'
    lab.innerHTML = Object.keys(LANGS)
      .flatMap((lang) =>
        ['home', 'stock', 'queue'].map(
          (screen) =>
            `<div class="frame frame-phone" style="width:360px;height:780px" data-lang="${lang}">` +
            `${screenHtml(dir, lang, screen, `lab-${dir.id}-${lang}-${screen}`)}</div>`,
        ),
      )
      .join('')
    document.body.appendChild(lab)
    let smallest = Infinity
    const sideways = []
    lab.querySelectorAll('.frame').forEach((frame) => {
      frame.querySelectorAll('a, button, input').forEach((el) => {
        smallest = Math.min(smallest, el.getBoundingClientRect().height)
      })
      const shell = frame.querySelector('.shell')
      if (shell.scrollWidth > shell.clientWidth + 1) sideways.push(frame.dataset.lang)
    })
    lab.remove()
    return { tabular, smallest: Math.round(smallest), sideways: [...new Set(sideways)] }
  }

  // --- the contact sheet ---------------------------------------------------

  function swatchesHtml(dir) {
    return (
      '<ul class="swatches" aria-label="Palette">' +
      SWATCHES.slice(0, 5)
        .map(
          ([name, label]) =>
            `<li style="background:${colourOf(dir, name)}" title="${label} ${colourOf(dir, name)}"></li>`,
        )
        .join('') +
      '</ul>'
    )
  }

  function cardHtml(dir, langChoice) {
    const lang = langChoice === 'default' ? dir.lang : langChoice
    return (
      `<article class="card" data-tone="${dir.dark ? 'dark' : 'light'}">` +
      `<div class="card-thumb" inert>${frameHtml('phone', screenHtml(dir, lang, 'home', `card-${dir.id}`))}</div>` +
      '<div class="card-body">' +
      `<h3 class="card-title"><a href="#${dir.id}"><span class="num-id">${pad(dir.num)}</span> ${esc(dir.name)}</a></h3>` +
      `<p class="card-line">${esc(dir.line)}</p>` +
      swatchesHtml(dir) +
      `<p class="card-meta">${esc(dir.fonts.map((f) => f.family).join(' + '))}${lang !== 'en' ? ` · shown in ${LANGS[lang]}` : ''}</p>` +
      '</div></article>'
    )
  }

  function renderIndex(focusId) {
    const langChoice = store.get('lookbook-lang', 'default')
    const tone = store.get('lookbook-tone', 'all')
    const shortlist = SHORTLIST.map((item, i) => {
      const dir = DIRS.find((d) => d.id === item.id)
      return (
        '<li class="pick">' +
        `<div class="pick-thumb" inert>${frameHtml('phone', screenHtml(dir, dir.lang, 'stock', `pick-${dir.id}`))}</div>` +
        `<div class="pick-body"><p class="pick-rank">Choice ${i + 1}</p>` +
        `<h3><a href="#${dir.id}"><span class="num-id">${pad(dir.num)}</span> ${esc(dir.name)}</a></h3>` +
        `<p>${esc(item.why)}</p></div></li>`
      )
    }).join('')

    const shown = DIRS.filter((d) => tone === 'all' || (tone === 'dark') === Boolean(d.dark))
    app.innerHTML =
      '<header class="masthead">' +
      '<p class="eyebrow">Restaurant Inventory · design directions · November 2026</p>' +
      '<h1>Inventory Look Book</h1>' +
      '<p class="lede">Twenty ways the app could look. Each one shows the same Home, Stock and Invoices to check screens with the same invoices, ' +
      'is built for a phone held in one hand in a busy kitchen, and could be adopted by changing <code>tokens.css</code> ' +
      'plus a few small rules. Open one to see it at full size, switch its language, check its contrast and copy its tokens.</p>' +
      '<p class="lede">Five of them are now in the app, chosen on the More page: Ticket (the default), Signal, Bistro, Pâtisserie and Herbier.</p>' +
      '</header>' +
      (shortlist
        ? '<section class="shortlist" aria-labelledby="shortlist-title">' +
          '<h2 id="shortlist-title">Shortlist for this app</h2>' +
          `<ol class="picks">${shortlist}</ol></section>`
        : '') +
      '<section class="sheet" aria-labelledby="sheet-title">' +
      '<div class="sheet-head"><h2 id="sheet-title">All twenty</h2>' +
      '<div class="controls">' +
      '<label class="control" for="lang-choice">Language of the mockups ' +
      '<select id="lang-choice">' +
      [['default', 'Each one’s own'], ['en', 'English'], ['fr', 'Français'], ['zh', '中文']]
        .map(([v, l]) => `<option value="${v}"${v === langChoice ? ' selected' : ''}>${l}</option>`)
        .join('') +
      '</select></label>' +
      '<div class="segmented" role="group" aria-label="Show">' +
      [['all', 'All'], ['light', 'Light'], ['dark', 'Dark']]
        .map(([v, l]) => `<button type="button" data-tone="${v}" aria-pressed="${v === tone}">${l}</button>`)
        .join('') +
      '</div></div></div>' +
      `<div class="grid">${shown.map((d) => cardHtml(d, langChoice)).join('')}</div>` +
      '</section>' +
      notesHtml()

    app.querySelector('#lang-choice').addEventListener('change', (e) => {
      store.set('lookbook-lang', e.target.value)
      renderIndex()
    })
    app.querySelectorAll('.segmented button').forEach((button) =>
      button.addEventListener('click', () => {
        store.set('lookbook-tone', button.dataset.tone)
        renderIndex()
      }),
    )
    fitAll(app)
    document.title = 'Inventory Look Book'
    if (focusId) {
      const link = app.querySelector(`.card-title a[href="#${focusId}"]`)
      if (link) {
        link.closest('.card').scrollIntoView({ block: 'center' })
        link.focus({ preventScroll: true })
      }
    } else {
      window.scrollTo(0, 0)
    }
  }

  function notesHtml() {
    return (
      '<footer class="notes">' +
      '<div><h2>How these were made</h2>' +
      '<p>Every mockup runs on a copy of the app’s own CSS (<code>base.css</code>, <code>components.css</code>, <code>shell.css</code>), ' +
      'so a direction is new token values plus the short list of tweaks shown with it. Text comes from the app’s translation files; ' +
      'dates and money use the same Canadian formats as the app (en-CA, fr-CA, zh-CN).</p>' +
      '<p>Contrast ratios, tabular figures, tap-target sizes and sideways scrolling are measured in this page when you open a direction, ' +
      'not typed in by hand. All fonts are open licence (SIL OFL) from Google Fonts; Chinese always uses the phone’s own font.</p>' +
      '<p>Rules followed in every direction: no gradients, glows, glass or emoji; green, amber and red only for meaning; ' +
      'warm neutral greys; one accent; icons only in the tab bar.</p></div>' +
      '<div><h2>Research</h2><ul class="sources">' +
      (window.LOOKBOOK_SOURCES || [])
        .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a> ${esc(s.note)}</li>`)
        .join('') +
      '</ul></div></footer>'
    )
  }

  // --- one direction -------------------------------------------------------

  function tokensBlock(dir) {
    const lines = [':root {']
    const all = { ...TODAY, ...NEW_TOKENS, ...dir.tokens }
    Object.keys(all).forEach((name) => {
      const isNew = name in NEW_TOKENS
      const changed = all[name] !== (TODAY[name] ?? NEW_TOKENS[name])
      if (isNew && !changed) return // unused new token: leave it out
      lines.push(`  ${name}: ${all[name]};${isNew ? ' /* new */' : ''}`)
    })
    lines.push('}')
    return lines.join('\n')
  }

  function detailHtml(dir, lang) {
    const i = DIRS.indexOf(dir)
    const prev = DIRS[(i + DIRS.length - 1) % DIRS.length]
    const next = DIRS[(i + 1) % DIRS.length]
    const rows = contrastRows(dir)
    return (
      '<nav class="crumbs" aria-label="Directions">' +
      `<a href="#" data-back="${dir.id}">← All twenty</a>` +
      `<span class="crumbs-step"><a href="#${prev.id}">Previous: ${esc(prev.name)}</a>` +
      `<a href="#${next.id}">Next: ${esc(next.name)}</a></span></nav>` +
      '<header class="detail-head">' +
      `<p class="eyebrow">${pad(dir.num)} · ${esc(dir.family)} · ${dir.dark ? 'dark' : 'light'}</p>` +
      `<h1>${esc(dir.name)}</h1>` +
      `<p class="lede">${esc(dir.idea)}</p>` +
      `<p class="signature"><span>Signature touch</span> ${esc(dir.signature)}</p>` +
      '<div class="segmented lang-switch" role="group" aria-label="Language of the mockups">' +
      Object.entries(LANGS)
        .map(([code, label]) => `<button type="button" lang="${code}" data-lang="${code}" aria-pressed="${code === lang}">${label}</button>`)
        .join('') +
      '</div></header>' +
      '<section class="screens" aria-label="Screens">' +
      `<figure><figcaption>Home on a phone</figcaption>${frameHtml('phone', screenHtml(dir, lang, 'home', `home-${dir.id}`))}</figure>` +
      `<figure><figcaption>Stock on a phone</figcaption>${frameHtml('phone', screenHtml(dir, lang, 'stock', `stock-${dir.id}`))}</figure>` +
      `<figure><figcaption>Invoices to check on a phone (two sample deliveries)</figcaption>${frameHtml('phone', screenHtml(dir, lang, 'queue', `queue-${dir.id}`))}</figure>` +
      `<figure><figcaption>Needs checking, confirmed, error, keyboard focus</figcaption>${frameHtml('states', statesHtml(dir, lang))}</figure>` +
      '</section>' +
      `<figure class="desktop"><figcaption>Stock on a computer, with the sidebar</figcaption>${frameHtml('desktop', screenHtml(dir, lang, 'stock', `desk-${dir.id}`))}</figure>` +
      '<section class="docs">' +
      '<div class="doc"><h2>Palette and contrast</h2>' +
      '<ul class="palette">' +
      SWATCHES.map(
        ([name, label]) =>
          `<li><span class="sw" style="background:${colourOf(dir, name)}"></span>` +
          `<span>${label}<br><code>${colourOf(dir, name)}</code></span></li>`,
      ).join('') +
      '</ul>' +
      '<div class="table-wrap"><table class="contrast"><thead><tr><th scope="col">Pair</th><th scope="col">Colours</th>' +
      '<th scope="col" class="num">Ratio</th><th scope="col">AA</th></tr></thead><tbody>' +
      rows
        .map(
          (r) =>
            `<tr><th scope="row">${esc(r.label)}</th>` +
            `<td><span class="chip" style="color:${r.fg};background:${r.bg}">Aa</span> <code>${r.fg}</code> on <code>${r.bg}</code></td>` +
            `<td class="num">${r.ratio.toFixed(2)}</td>` +
            `<td class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'pass' : 'fail'} (${r.min}:1)</td></tr>`,
        )
        .join('') +
      '</tbody></table></div>' +
      (dir.linksUseText ? '<p class="small">Links and quiet buttons use the text colour with an accent underline, so the accent is never used for text.</p>' : '') +
      '</div>' +
      '<div class="doc"><h2>Type</h2><ul class="fonts">' +
      dir.fonts
        .map(
          (f) =>
            `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.family)}</a> <span>${esc(f.role)} · ${esc(f.licence)}</span></li>`,
        )
        .join('') +
      '<li>Chinese <span>the phone’s own font: PingFang SC, Microsoft YaHei, Noto Sans CJK SC</span></li></ul>' +
      '<h2>Inspired by</h2><ul class="inspiration">' +
      dir.inspiration
        .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a> ${esc(s.note)}</li>`)
        .join('') +
      '</ul>' +
      '<h2>Checks</h2><ul class="checks" data-checks>' +
      `<li>Contrast: ${rows.filter((r) => r.pass).length} of ${rows.length} pairs pass AA</li>` +
      '<li>Measuring figures, tap targets and sideways scroll…</li></ul>' +
      '</div></section>' +
      '<section class="code-blocks">' +
      codeBlock('tokens', 'Tokens for frontend/src/styles/tokens.css', tokensBlock(dir)) +
      codeBlock('tweaks', 'Component tweaks (add to components.css / shell.css)', dir.tweaks.trim() || '/* none */') +
      '</section>' +
      `<nav class="crumbs crumbs-end" aria-label="More directions"><a href="#${prev.id}">Previous: ${esc(prev.name)}</a>` +
      `<a href="#${next.id}">Next: ${esc(next.name)}</a></nav>`
    )
  }

  function codeBlock(id, title, text) {
    return (
      `<div class="code"><div class="code-head"><h2 id="code-${id}">${esc(title)}</h2>` +
      `<button type="button" class="copy" data-copy="${id}">Copy</button></div>` +
      `<pre aria-labelledby="code-${id}"><code id="text-${id}">${esc(text)}</code></pre></div>`
    )
  }

  function renderDetail(dir, lang) {
    lang = lang || dir.lang
    app.innerHTML = detailHtml(dir, lang)
    document.title = `${dir.name} · Inventory Look Book`
    fitAll(app)

    app.querySelectorAll('.lang-switch button').forEach((button) =>
      button.addEventListener('click', () => {
        const y = window.scrollY
        renderDetail(dir, button.dataset.lang)
        window.scrollTo(0, y)
        app.querySelector(`.lang-switch [data-lang="${button.dataset.lang}"]`).focus()
      }),
    )
    // Back to the sheet, with this direction's card in view and focused.
    app.querySelector('[data-back]').addEventListener('click', (e) => {
      e.preventDefault()
      try {
        window.history.pushState(null, '', location.pathname + location.search)
      } catch {
        /* some previews refuse pushState; the sheet still shows */
      }
      renderIndex(dir.id)
    })
    app.querySelectorAll('.copy').forEach((button) =>
      button.addEventListener('click', () => {
        const code = app.querySelector(`#text-${button.dataset.copy}`)
        const done = () => {
          button.textContent = 'Copied'
          setTimeout(() => (button.textContent = 'Copy'), 1600)
        }
        const selectIt = () => {
          const range = document.createRange()
          range.selectNodeContents(code)
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(range)
          button.textContent = 'Selected: press Ctrl+C'
        }
        if (navigator.clipboard) navigator.clipboard.writeText(code.textContent).then(done, selectIt)
        else selectIt()
      }),
    )

    // Measure once the fonts are in, so the widths are the real ones.
    document.fonts.ready.then(() => {
      const list = app.querySelector('[data-checks]')
      if (!list || !document.body.contains(list)) return
      const m = measure(dir)
      const rows = contrastRows(dir)
      list.innerHTML =
        `<li>Contrast: ${rows.filter((r) => r.pass).length} of ${rows.length} pairs pass AA</li>` +
        `<li>Money and quantities in tabular figures: ${m.tabular ? 'yes' : 'no'} (measured)</li>` +
        `<li>Smallest tap target: ${m.smallest} px (44 px needed)</li>` +
        `<li>Sideways scrolling on a 360 px phone: ${m.sideways.length ? `yes, in ${m.sideways.map((l) => LANGS[l]).join(', ')}` : 'none, in English, French or Chinese'}</li>`
    })
  }

  // --- start -----------------------------------------------------------------

  function route() {
    const dir = DIRS.find((d) => d.id === location.hash.slice(1))
    if (dir) {
      renderDetail(dir)
      window.scrollTo(0, 0)
    } else {
      renderIndex()
    }
  }

  // Links inside the mockups go nowhere.
  app.addEventListener('click', (e) => {
    if (e.target.closest('.frame a')) e.preventDefault()
  })

  // For checking every direction at once from the console.
  window.LOOKBOOK_CHECK_ALL = () =>
    DIRS.map((dir) => {
      const rows = contrastRows(dir)
      return {
        id: dir.id,
        failing: rows.filter((r) => !r.pass).map((r) => `${r.label} ${r.ratio.toFixed(2)}`),
        ...measure(dir),
      }
    })

  installStyles()
  window.addEventListener('hashchange', route)
  route()
})()
