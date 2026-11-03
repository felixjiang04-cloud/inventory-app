// The looks someone can choose on the More page (components/LookPicker.tsx).
// Each look is a set of colours, fonts and a few rules in
// styles/looks/<look>.css, switched on by <html data-look="…">. The choice
// is remembered by this browser only, so every phone or computer can have
// its own.

export const LOOKS = ['ticket', 'signal', 'bistro', 'patisserie', 'herbier'] as const
export type Look = (typeof LOOKS)[number]

export const DEFAULT_LOOK: Look = 'ticket'

const STORAGE_KEY = 'look'

// The fonts each look needs. Ticket's are bundled in main.tsx because it is
// the default; the others are separate files, downloaded the first time
// someone picks that look or opens the More page (which previews them all).
const FONTS: Record<Look, () => Promise<unknown>> = {
  ticket: () => Promise.resolve(),
  signal: () => import('@fontsource-variable/atkinson-hyperlegible-next/index.css'),
  bistro: () =>
    Promise.all([
      import('@fontsource-variable/bodoni-moda/opsz.css'),
      import('@fontsource-variable/bodoni-moda/opsz-italic.css'),
      import('@fontsource-variable/jost/index.css'),
      import('@fontsource-variable/jost/wght-italic.css'),
    ]),
  patisserie: () =>
    Promise.all([
      import('@fontsource/gilda-display/index.css'),
      import('@fontsource-variable/nunito-sans/index.css'),
    ]),
  herbier: () =>
    Promise.all([
      import('@fontsource-variable/eb-garamond/index.css'),
      import('@fontsource-variable/eb-garamond/wght-italic.css'),
    ]),
}

export function isLook(value: unknown): value is Look {
  return (LOOKS as readonly unknown[]).includes(value)
}

// The look this browser chose before, or Ticket.
export function savedLook(): Look {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isLook(stored) ? stored : DEFAULT_LOOK
  } catch {
    return DEFAULT_LOOK // storage is blocked, e.g. in a private window
  }
}

// The look on screen right now.
export function currentLook(): Look {
  const shown = document.documentElement.dataset.look
  return isLook(shown) ? shown : DEFAULT_LOOK
}

// A font that fails to download falls back to the next one in the list;
// the look still works.
export function loadFonts(look: Look): Promise<void> {
  return FONTS[look]().then(
    () => undefined,
    () => undefined,
  )
}

// Show a look now.
export function applyLook(look: Look) {
  document.documentElement.dataset.look = look
  void loadFonts(look)
}

// Show a look and remember it on this device.
export function chooseLook(look: Look) {
  applyLook(look)
  try {
    window.localStorage.setItem(STORAGE_KEY, look)
  } catch {
    // storage is blocked: the look still applies until the page is closed
  }
}
