from fractions import Fraction

import pytest

from app.units import UnknownUnitError, to_canonical, units_conflict


def test_kg_to_grams() -> None:
    assert to_canonical(Fraction(5, 2), "kg") == ("g", 2500)


def test_grams_pass_through() -> None:
    assert to_canonical(Fraction(750), "g") == ("g", 750)


def test_pounds_round_to_nearest_gram() -> None:
    # 1.5 lb = 680.388 g -> 680
    assert to_canonical(Fraction(3, 2), "lb") == ("g", 680)


def test_chinese_catty_is_500g() -> None:
    assert to_canonical(Fraction(2), "斤") == ("g", 1000)


def test_litres_to_ml() -> None:
    assert to_canonical(Fraction(3, 4), "L") == ("ml", 750)


def test_dozen_to_each() -> None:
    assert to_canonical(Fraction(2), "dozen") == ("each", 24)


def test_unit_spelling_is_case_and_space_insensitive() -> None:
    assert to_canonical(Fraction(1), "  KG ") == ("g", 1000)


def test_unknown_unit_raises() -> None:
    with pytest.raises(UnknownUnitError):
        to_canonical(Fraction(1), "bushel")


@pytest.mark.parametrize(
    ("text_unit", "item_unit", "conflict"),
    [
        ("g", "ml", True),  # "5KG" onto an item counted in ml
        ("ml", "g", True),  # "3L" onto an item counted in grams
        ("g", "g", False),
        ("ml", "ml", False),
        ("each", "each", False),
        ("g", "each", False),  # a 5 kg bag counted as 1 bag is fine
        ("ml", "each", False),
        ("each", "g", False),  # "1 DZ" eggs onto grams: owner types the weight
        ("each", "ml", False),
    ],
)
def test_only_weight_vs_volume_conflicts(text_unit, item_unit, conflict) -> None:
    assert units_conflict(text_unit, item_unit) is conflict
