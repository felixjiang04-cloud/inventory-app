"""Prepare an uploaded invoice photo before it is stored or read.

Phones send big photos, often stored sideways with a "rotate me" note in
their hidden metadata (EXIF), which can also hold the GPS location where
the photo was taken. So every upload is: checked to really be an image,
turned upright, stripped of all metadata, shrunk so the long side is at
most MAX_SIDE pixels, and re-saved as JPEG.
"""

from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # bigger uploads are refused
MAX_SIDE = 2000  # pixels: plenty for printed text, small enough to send fast


class NotAnImage(ValueError):
    """The upload isn't an image we can open (or is absurdly large)."""


def prepare_photo(data: bytes) -> bytes:
    """Upright, metadata-free JPEG of at most MAX_SIDE x MAX_SIDE pixels."""
    try:
        image = Image.open(BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise NotAnImage() from exc

    image = ImageOps.exif_transpose(image)  # rotate the way the phone meant
    image = image.convert("RGB")  # JPEG has no transparency or palettes
    image.thumbnail((MAX_SIDE, MAX_SIDE))  # shrink, keeping proportions
    out = BytesIO()
    image.save(out, "JPEG", quality=90)  # a fresh save writes no metadata
    return out.getvalue()
