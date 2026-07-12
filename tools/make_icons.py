"""Generate the PWA icons for SOFT Kids Adventure.

The game is about a whole barangay of kids, not one child, so the mark is not a
face. It is a nipa house under a sun, drawn in the same claymorphic language as
the game's UI: chunky shapes, a soft outer shadow, a light rim on every form.

Rendered at 4x and downsampled, which is what gives the curves clean edges at
192px. Writes 512 / 192 / 180 into soft-kids-game/.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "soft-kids-game"

SS = 4                      # supersample factor
S = 512 * SS                # working canvas

CORAL = (255, 122, 156, 255)
CORAL_DK = (226, 90, 126, 255)
SUN = (255, 224, 102, 255)
SUN_RAY = (255, 206, 61, 255)
ROOF = (150, 100, 62, 255)
ROOF_HI = (183, 133, 88, 255)
WALL = (255, 252, 246, 255)
WALL_SH = (232, 220, 205, 255)
DOOR = (122, 82, 50, 255)
WINDOW = (255, 224, 140, 255)
GRASS = (95, 174, 67, 255)
GRASS_HI = (139, 205, 104, 255)


def rr(d, box, r, fill):
    d.rounded_rectangle(box, radius=r, fill=fill)


def build() -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = S / 512.0                       # one design unit = one 512px pixel

    # --- coral squircle, with a lighter top: the clay "lit from above" rule
    rr(d, [0, 0, S, S], int(118 * u), CORAL)
    top = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(top).rounded_rectangle([0, 0, S, int(300 * u)], radius=int(118 * u),
                                          fill=(255, 255, 255, 34))
    img.alpha_composite(top)
    d = ImageDraw.Draw(img)

    # --- sun, behind everything
    cx, cy, r = S * 0.5, 200 * u, 96 * u
    for i in range(12):
        a = math.radians(i * 30 + 15)
        d.line([cx + math.cos(a) * r * 1.16, cy + math.sin(a) * r * 1.16,
                cx + math.cos(a) * r * 1.62, cy + math.sin(a) * r * 1.62],
               fill=SUN_RAY, width=int(19 * u))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SUN)
    d.ellipse([cx - r * 0.72, cy - r * 0.78, cx + r * 0.30, cy - r * 0.10],
              fill=(255, 243, 176, 200))          # inner highlight

    # --- grass mound
    d.ellipse([-40 * u, 330 * u, S + 40 * u, 620 * u], fill=GRASS)
    d.ellipse([20 * u, 344 * u, S - 20 * u, 470 * u], fill=GRASS_HI)

    # --- the house: a soft drop shadow, then walls, roof, door, windows
    hw, base = 132 * u, 424 * u
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse(
        [cx - hw * 1.25, base - 18 * u, cx + hw * 1.25, base + 42 * u], fill=(60, 30, 50, 90))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(10 * u)))
    d = ImageDraw.Draw(img)

    rr(d, [cx - hw, base - 150 * u, cx + hw, base], int(20 * u), WALL)
    d.polygon([(cx - hw, base - 150 * u), (cx - hw + 22 * u, base - 150 * u),
               (cx - hw + 22 * u, base), (cx - hw, base)], fill=WALL_SH)

    d.polygon([(cx - hw * 1.34, base - 138 * u), (cx, base - 262 * u),
               (cx + hw * 1.34, base - 138 * u)], fill=ROOF)
    d.polygon([(cx - hw * 1.34, base - 138 * u), (cx, base - 262 * u),
               (cx + hw * 0.94, base - 158 * u)], fill=ROOF_HI)

    rr(d, [cx - 30 * u, base - 92 * u, cx + 30 * u, base], int(10 * u), DOOR)
    d.ellipse([cx + 14 * u, base - 52 * u, cx + 24 * u, base - 42 * u], fill=SUN)
    for sx in (-1, 1):
        wx = cx + sx * 84 * u
        rr(d, [wx - 27 * u, base - 118 * u, wx + 27 * u, base - 64 * u], int(9 * u), WINDOW)
        d.polygon([(wx - 27 * u, base - 118 * u), (wx + 2 * u, base - 118 * u),
                   (wx - 27 * u, base - 89 * u)], fill=(255, 243, 205, 255))
    return img


def main():
    img = build()
    OUT.mkdir(exist_ok=True)
    for size, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")]:
        img.resize((size, size), Image.LANCZOS).save(OUT / name)
        print(f"wrote {OUT / name}")


if __name__ == "__main__":
    main()
