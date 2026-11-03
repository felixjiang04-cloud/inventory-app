// The app's logo (public/favicon.svg: an invoice with lines on it), drawn
// inline so it takes the colours of the chosen look (--brand-tile and
// --brand-paper in the look's tokens). The browser-tab icon stays the file.
export default function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
      <rect className="bm-tile" width="32" height="32" rx="6" />
      <rect className="bm-paper" x="8" y="7" width="16" height="18" rx="2" />
      <rect className="bm-line" x="11" y="11" width="10" height="2" rx="1" />
      <rect className="bm-line" x="11" y="15" width="7" height="2" rx="1" />
      <rect className="bm-line" x="11" y="19" width="10" height="2" rx="1" />
    </svg>
  )
}
