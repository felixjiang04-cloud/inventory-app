"""Hand-written unit conversion table.

CLAUDE.md rule: unit conversions live in hand-written tables, NEVER
generated at runtime by a model. To support a new unit spelling, add a
row here by hand and cover it in tests/test_units.py.

Canonical base units: 'g' (weight), 'ml' (volume), 'each' (count).
Quantities are stored as integers of these base units.
"""

import re
from fractions import Fraction

# spelling (lowercased) -> (base unit, base units per 1 of this unit)
CONVERSIONS: dict[str, tuple[str, Fraction]] = {
    # --- weight -> grams ---
    "g": ("g", Fraction(1)),
    "kg": ("g", Fraction(1000)),
    "lb": ("g", Fraction(453592, 1000)),   # 1 lb = 453.592 g
    "lbs": ("g", Fraction(453592, 1000)),
    "oz": ("g", Fraction(283495, 10000)),  # 1 oz = 28.3495 g
    "克": ("g", Fraction(1)),
    "公斤": ("g", Fraction(1000)),
    "斤": ("g", Fraction(500)),            # Chinese market catty = 500 g
    # --- volume -> milliliters ---
    "ml": ("ml", Fraction(1)),
    "cl": ("ml", Fraction(10)),
    "l": ("ml", Fraction(1000)),
    "毫升": ("ml", Fraction(1)),
    "升": ("ml", Fraction(1000)),
    # --- count -> each ---
    "each": ("each", Fraction(1)),
    "ea": ("each", Fraction(1)),
    "un": ("each", Fraction(1)),           # unité
    "pc": ("each", Fraction(1)),
    "pcs": ("each", Fraction(1)),
    "dz": ("each", Fraction(12)),
    "dozen": ("each", Fraction(12)),
    "douzaine": ("each", Fraction(12)),
    "个": ("each", Fraction(1)),
    "只": ("each", Fraction(1)),
    "打": ("each", Fraction(12)),
}


class UnknownUnitError(ValueError):
    """The unit spelling is not in the hand-written table."""


# Matches "5KG", "3 l", "2,5 kg", "398ml" ... — a number followed by a unit
# spelling from the table above. Longest spellings first so "ml" wins over "l".
_SIZE_TOKEN = re.compile(
    r"(\d+(?:[.,]\d+)?)\s*("
    + "|".join(
        re.escape(u) for u in sorted(CONVERSIONS, key=len, reverse=True)
    )
    + r")(?![a-z])",
    re.IGNORECASE,
)


def guess_qty_per_unit(raw_text: str) -> tuple[str, int] | None:
    """Suggest a size from invoice line text, e.g. "ROMA TOM 5KG" -> ('g', 5000).

    Uses the LAST size token in the text (sizes usually trail the name).
    Only a hint for the review screen — the owner always confirms the
    number before it is stored. Returns None when nothing matches.
    """
    matches = _SIZE_TOKEN.findall(raw_text)
    if not matches:
        return None
    number_text, unit = matches[-1]
    quantity = Fraction(number_text.replace(",", "."))
    if quantity <= 0:
        return None
    return to_canonical(quantity, unit)


def to_canonical(quantity: Fraction, unit: str) -> tuple[str, int]:
    """Convert a quantity to an integer amount of its base unit.

    Rounds to the nearest whole base unit (ties round up); quantities
    are validated positive before they get here. Deterministic — same
    input always gives the same output.
    """
    key = unit.strip().lower()
    if key not in CONVERSIONS:
        raise UnknownUnitError(unit)
    base, factor = CONVERSIONS[key]
    exact = quantity * factor
    return base, int(exact + Fraction(1, 2))
