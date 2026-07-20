from app.units import guess_qty_per_unit


def test_trailing_kg() -> None:
    assert guess_qty_per_unit("ROMA TOM 5KG") == ("g", 5000)


def test_litres_with_space() -> None:
    assert guess_qty_per_unit("HUILE OLIVE 3 L") == ("ml", 3000)


def test_decimal_comma() -> None:
    assert guess_qty_per_unit("FROMAGE 2,5 kg") == ("g", 2500)


def test_last_size_token_wins() -> None:
    # "24X398ML": the pack count is manual for now; the trailing size wins
    assert guess_qty_per_unit("TOMATE DICE 24X398ML") == ("ml", 398)


def test_chinese_units() -> None:
    assert guess_qty_per_unit("大米 10斤") == ("g", 5000)


def test_no_size_token() -> None:
    assert guess_qty_per_unit("SERVICE CHARGE") is None


def test_unit_not_matched_inside_word() -> None:
    # the "l" in "SEL" must not be read as litres
    assert guess_qty_per_unit("GROS SEL") is None
