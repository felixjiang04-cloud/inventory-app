import type { ReactNode } from 'react'

// A handful of simple line icons, drawn for this app. Used only where they
// help recognition (the navigation), never as decoration.
const SHAPES = {
  home: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
  add: (
    <>
      <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  check: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  stock: (
    <>
      <path d="M4 8 12 4l8 4v8l-8 4-8-4z" />
      <path d="m4 8 8 4 8-4M12 12v8" />
    </>
  ),
  more: (
    <>
      <path d="M5 7h14M5 12h14M5 17h14" />
    </>
  ),
} satisfies Record<string, ReactNode>

export default function Icon({ name }: { name: keyof typeof SHAPES }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {SHAPES[name]}
    </svg>
  )
}
