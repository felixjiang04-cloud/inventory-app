# Design guidelines: look made by people, not by AI

The app should look like it was designed for one job: a restaurant
checking invoices and stock, often on a phone, in a busy kitchen.
Below are the tells that make a site look AI-generated or templated
(avoid them), and what to do instead. Check every new screen against
the checklist at the end.

## Avoid: tells that read as "AI made this"

**Colour and effects**
- Purple/indigo-to-blue or pink gradients: backgrounds, buttons,
  gradient-filled headline text.
- Glassmorphism (frosted see-through cards), glowing blurred blobs or
  "aurora" backgrounds, neon glows, coloured shadows, gradient borders.
- Dark mode with neon accents as the default "techy" look.

**Layout**
- Everything in identical rounded cards with soft shadows; grids of
  three "feature cards", each an icon in a coloured circle plus a title
  plus two lines of text.
- Every section centred, the same height, the same pattern; big empty
  hero sections with a vague headline.
- Dashboards of KPI cards with fake trend arrows (+12% ↑) and
  decorative charts that answer no real question.

**Type and icons**
- One default sans-serif at default weights, a giant bold headline over
  grey subtext, low-contrast grey body text.
- Decorative icons on every label and menu item; the sparkle ✨, rocket
  and lightning icons; emoji in headings and buttons (🚀 📊 💡).
- An unmodified component-library look. Default shadcn/ui (zinc greys,
  Inter, Lucide icons, rounded-lg cards) is the signature of AI app
  builders.

**Motion**
- Everything fading or sliding in on scroll, cards growing on hover,
  shimmering skeletons for things that load instantly, pulsing badges,
  typewriter text.

**Words**
- Marketing filler: unlock, seamless(ly), effortless, revolutionize,
  elevate, streamline, supercharge, harness, cutting-edge, robust,
  game-changer, "in today's fast-paced world".
- Lists of three everywhere ("Fast, simple and secure"), Title Case On
  Every Heading, exclamation marks, cutesy empty states ("Nothing here
  yet! 🎉").
- Advertising the AI: "AI-powered ✨", "Smart", "Magic".
- Leftover placeholders: Lorem ipsum, John Doe, Acme Inc, invented
  testimonials and stats ("10,000+ happy restaurants").
- Stiff, literal FR/ZH that reads like machine translation.

**Template leftovers**
- The default Vite favicon (the purple lightning bolt), default page
  titles, a chat bubble in the corner, three different button styles,
  modals and toasts for everything.

## Do instead

- **Design for the real place.** A phone held in one hand, maybe wet
  hands, bad light: big tap targets (44 px or more), high contrast,
  few steps, the main action within thumb reach.
- **Colour with a reason.** Warm neutral greys plus one accent colour
  chosen for the brand. Use colour for meaning (needs checking,
  confirmed, error), not decoration. No gradients.
- **Type with hierarchy.** A clear size scale. Money and quantities in
  tabular figures (`font-variant-numeric: tabular-nums`), right-aligned
  in tables so the columns line up.
- **Show the data plainly.** Invoices and stock are lists and tables,
  not card grids. The number someone came for is the biggest thing on
  the screen.
- **Plain, specific words in the user's terms:** "Invoices to check",
  "Photos waiting to be read", "Post to stock". Sentence case. Say what
  happened and what to do next.
- **Local formats.** Dates, money (CAD) and units shown the way each
  language writes them (`fr-CA`, `en-CA`, `zh-CN`).
- **Useful empty states** that say what to do next, not a joke.
- **Restraint.** One spacing scale, one small corner radius, thin
  borders rather than heavy shadows, icons only where they help
  recognition.
- **Motion only to explain a change** (a line confirmed, an item added):
  short, and switched off when the system asks for reduced motion.
- **The AI is invisible.** The photo screen says "Reading the
  invoice…" and then shows what to check; it never brags about AI.
- **Real text and real content.** French and Chinese read by a native
  speaker; real example data in screenshots and demos.
- **Accessible by default:** visible focus outlines, every input
  labelled, AA contrast, still usable at 200% zoom.
- **Our own identity:** our own favicon and logo, and our own name in
  the title.

## Checklist for every screen

1. Does it work one-handed on a phone, with nothing to scroll sideways?
2. Is the most important number or action the most visible thing?
3. Any gradient, glow, blob, glass effect or emoji? Remove it.
4. Is every icon helping someone recognise something? If not, remove it.
5. Is the text plain and specific, with no filler words, in all three
   languages?
6. Are dates, money and units in the reader's language format?
7. Do the empty, loading and error states say what to do next?
8. Can it be used with a keyboard alone, with visible focus?
