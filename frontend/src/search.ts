// Search that forgives accents and capitals: "creme" finds "Crème",
// "marche" finds "MARCHÉ CENTRAL". Chinese text is matched as typed.
const fold = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function matchesSearch(text: string, query: string): boolean {
  return fold(text).includes(fold(query.trim()))
}
