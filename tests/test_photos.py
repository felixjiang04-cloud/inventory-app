"""Photo preparation (pure functions, no database)."""

from io import BytesIO

import pytest
from PIL import Image

from app.photos import MAX_SIDE, NotAnImage, prepare_photo


def make_jpeg(width: int, height: int, exif: Image.Exif | None = None) -> bytes:
    out = BytesIO()
    image = Image.new("RGB", (width, height), "white")
    if exif is None:
        image.save(out, "JPEG")
    else:
        image.save(out, "JPEG", exif=exif)
    return out.getvalue()


def opened(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data))


def test_something_that_is_not_an_image_is_refused() -> None:
    with pytest.raises(NotAnImage):
        prepare_photo(b"%PDF-1.7 certainly not a photo")


def test_big_photo_is_shrunk_keeping_its_shape() -> None:
    result = opened(prepare_photo(make_jpeg(4000, 3000)))
    assert result.size == (MAX_SIDE, 1500)
    assert result.format == "JPEG"


def test_small_photo_is_not_enlarged() -> None:
    assert opened(prepare_photo(make_jpeg(800, 600))).size == (800, 600)


def test_sideways_phone_photo_is_turned_upright() -> None:
    exif = Image.Exif()
    exif[0x0112] = 6  # Orientation tag: "rotate 90 degrees to view"
    result = opened(prepare_photo(make_jpeg(400, 300, exif=exif)))
    assert result.size == (300, 400)


def test_hidden_metadata_is_removed() -> None:
    exif = Image.Exif()
    exif[0x010F] = "PhoneMaker"  # camera make; GPS location lives in this same block
    source = make_jpeg(400, 300, exif=exif)
    assert len(opened(source).getexif()) > 0  # the test photo really has metadata

    assert len(opened(prepare_photo(source)).getexif()) == 0


def test_png_with_transparency_becomes_a_plain_jpeg() -> None:
    out = BytesIO()
    Image.new("RGBA", (300, 200), (255, 0, 0, 128)).save(out, "PNG")
    result = opened(prepare_photo(out.getvalue()))
    assert result.format == "JPEG"
    assert result.mode == "RGB"
