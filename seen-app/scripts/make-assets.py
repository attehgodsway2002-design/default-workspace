"""Generate Seen's local art: category photo plates (SVG) + 360Â° panorama strips (PNG).

Deterministic, offline, no stock photography â€” every storefront image in the demo
is generated from the category palette and the corridor identity.
"""
import io
import math
import pathlib
import struct
import sys
import zlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = pathlib.Path("public")
PHOTOS = ROOT / "photos"
PANOS = ROOT / "panoramas"
PHOTOS.mkdir(parents=True, exist_ok=True)
PANOS.mkdir(parents=True, exist_ok=True)

PALETTES = {
    "food": ["#F6E7D3", "#E9B27A", "#B4552D", "#5C2E12", "#8C6A3F"],
    "beauty": ["#F7E6EA", "#E7B9C6", "#B5657F", "#5E2B3E", "#C79A6B"],
    "repair": ["#E3EBF1", "#9FB9CC", "#3F6E8C", "#123243", "#C99B4A"],
    "health": ["#E8F0EA", "#B7D3C2", "#4F8A6D", "#1E3F33", "#D8C9A3"],
    "fitness": ["#E9E7E3", "#C9C2B8", "#6B6A66", "#1E1E1D", "#D9762B"],
    "professional": ["#EDE7DC", "#C8BBA4", "#7C6A4E", "#22303F", "#D9A34A"],
}

VARIANTS = {
    "food": ["counter", "table", "window", "plates"],
    "beauty": ["chair", "mirror", "shelves", "wash"],
    "repair": ["bench", "tools", "shelf", "counter"],
    "health": ["reception", "room", "shelves", "window"],
    "fitness": ["racks", "floor", "mirror", "door"],
    "professional": ["desks", "window", "booth", "garden"],
}


def plate(category: str, variant: int) -> str:
    c1, c2, c3, c4, c5 = PALETTES[category]
    name = VARIANTS[category][variant % 4]
    seed = (hash((category, variant)) & 0xFFFF) / 0xFFFF
    shapes = []

    if name in ("counter", "bench", "racks", "reception"):
        shapes.append(
            f'<rect x="0" y="520" width="1200" height="280" fill="{c4}" opacity="0.92"/>'
            f'<rect x="0" y="500" width="1200" height="34" fill="{c5}" opacity="0.95"/>'
            f'<rect x="90" y="330" width="420" height="180" rx="14" fill="{c2}" opacity="0.5"/>'
            f'<circle cx="830" cy="400" r="120" fill="{c3}" opacity="0.32"/>'
        )
    if name in ("table", "plates", "chair", "wash"):
        shapes.append(
            f'<ellipse cx="600" cy="700" rx="420" ry="120" fill="{c4}" opacity="0.55"/>'
            f'<circle cx="470" cy="660" r="86" fill="{c1}" opacity="0.85"/>'
            f'<circle cx="470" cy="660" r="52" fill="{c3}" opacity="0.45"/>'
            f'<circle cx="720" cy="690" r="64" fill="{c1}" opacity="0.8"/>'
            f'<circle cx="720" cy="690" r="36" fill="{c2}" opacity="0.55"/>'
        )
    if name in ("window", "mirror", "door", "garden"):
        shapes.append(
            f'<rect x="640" y="110" width="440" height="420" rx="18" fill="{c1}" opacity="0.55"/>'
            f'<rect x="660" y="130" width="400" height="380" rx="10" fill="{c2}" opacity="0.55"/>'
            f'<path d="M660 510 L1060 130" stroke="{c1}" stroke-width="10" opacity="0.5"/>'
            f'<path d="M860 130 L860 510" stroke="{c1}" stroke-width="8" opacity="0.4"/>'
        )
    if name in ("shelves", "tools", "shelf", "booth"):
        for row in range(3):
            y = 170 + row * 140
            shapes.append(
                f'<rect x="120" y="{y}" width="560" height="14" fill="{c4}" opacity="0.7"/>'
            )
            for col in range(6):
                h = 40 + ((seed * 97 + row * 31 + col * 17) % 60)
                shapes.append(
                    f'<rect x="{140 + col * 88}" y="{y - h}" width="58" height="{h}" rx="6" '
                    f'fill="{c3 if col % 2 == 0 else c5}" opacity="0.62"/>'
                )
    if name in ("floor", "desks"):
        for index in range(4):
            x = 60 + index * 280
            shapes.append(
                f'<rect x="{x}" y="{380 + (index % 2) * 40}" width="240" height="22" rx="8" fill="{c3}" opacity="0.55"/>'
                f'<rect x="{x + 30}" y="{402 + (index % 2) * 40}" width="16" height="130" fill="{c4}" opacity="0.6"/>'
                f'<rect x="{x + 194}" y="{402 + (index % 2) * 40}" width="16" height="130" fill="{c4}" opacity="0.6"/>'
            )

    bokeh = "".join(
        f'<circle cx="{(seed * 1200 + i * 197) % 1200:.0f}" cy="{(seed * 500 + i * 131) % 520:.0f}" '
        f'r="{18 + (i * 13) % 46}" fill="{c1}" opacity="{0.05 + (i % 4) * 0.02:.2f}"/>'
        for i in range(14)
    )

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="55%" stop-color="{c2}"/>
      <stop offset="100%" stop-color="{c3}"/>
    </linearGradient>
    <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{c1}" stop-opacity="0.0"/>
      <stop offset="100%" stop-color="{c4}" stop-opacity="0.45"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="{variant + 3}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <circle cx="{180 + seed * 400:.0f}" cy="{150 + seed * 120:.0f}" r="220" fill="{c1}" opacity="0.35" filter="url(#soft)"/>
  {bokeh}
  <g filter="url(#soft)" opacity="0.9">{shapes}</g>
  <rect width="1200" height="800" fill="url(#warm)"/>
  <rect width="1200" height="800" filter="url(#grain)" opacity="0.5"/>
</svg>
"""


def write_png(path: pathlib.Path, width: int, height: int, rows: list[bytearray]) -> None:
    raw = b"".join(b"\x00" + bytes(row) for row in rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def panorama(variant: str) -> list[bytearray]:
    width, height = 1024, 512
    horizon = int(height * 0.62)
    palettes = {
        "cafe": ((26, 42, 61), (232, 177, 115), (61, 34, 20), (255, 214, 150)),
        "salon": ((38, 28, 46), (231, 185, 198), (54, 28, 42), (255, 224, 214)),
        "gym": ((22, 24, 26), (217, 118, 43), (26, 22, 20), (255, 196, 120)),
    }
    sky_top, sky_bottom, building, glow = palettes[variant]
    rows: list[bytearray] = []

    # deterministic skyline heights per variant
    seed = {"cafe": 7, "salon": 13, "gym": 23}[variant]
    heights = []
    for index in range(64):
        heights.append(120 + ((index * 37 + seed * 19) % 210))

    for y in range(height):
        row = bytearray()
        for x in range(width):
            if y < horizon:
                t = y / horizon
                r = lerp(sky_top[0], sky_bottom[0], t ** 0.8)
                g = lerp(sky_top[1], sky_bottom[1], t ** 0.8)
                b = lerp(sky_top[2], sky_bottom[2], t ** 0.8)
                # sun glow
                dx = x - int(width * 0.32)
                dy = y - int(horizon * 0.42)
                dist = math.sqrt(dx * dx + dy * dy)
                if dist < 230:
                    k = max(0.0, 1 - dist / 230) ** 2
                    r, g, b = lerp(r, glow[0], k * 0.85), lerp(g, glow[1], k * 0.85), lerp(b, glow[2], k * 0.85)
                # skyline band
                block = heights[(x // 32) % len(heights)]
                if y > horizon - block:
                    shade = 0.55 + 0.25 * ((x // 32) % 3)
                    r, g, b = building[0] * shade, building[1] * shade, building[2] * shade
                    # lit windows
                    if (x % 16 < 5) and (y % 22 < 9) and ((x // 16 + y // 22) % 3 == 0):
                        r, g, b = glow[0] * 0.85, glow[1] * 0.8, glow[2] * 0.6
            else:
                depth = (y - horizon) / (height - horizon)
                base = 0.35 - depth * 0.2
                r = building[0] * base + glow[0] * (0.12 + depth * 0.22)
                g = building[1] * base + glow[1] * (0.1 + depth * 0.2)
                b = building[2] * base + glow[2] * (0.08 + depth * 0.16)
                # road markings
                if abs((x % 260) - 130) < 10 and depth > 0.25:
                    r, g, b = glow[0] * 0.7, glow[1] * 0.65, glow[2] * 0.5
            # slight vignette
            vx = abs(x / width - 0.5) * 2
            dim = 1 - 0.22 * (vx ** 2)
            row += bytes((max(0, min(255, int(r * dim))), max(0, min(255, int(g * dim))), max(0, min(255, int(b * dim)))))
        rows.append(row)
    return rows


for category in PALETTES:
    for variant in range(4):
        (PHOTOS / f"{category}-{variant + 1}.svg").write_text(plate(category, variant), encoding="utf-8")

for variant in ("cafe", "salon", "gym"):
    write_png(PANOS / f"{variant}-1.png", 1024, 512, panorama(variant))

print("photos:", len(list(PHOTOS.glob('*.svg'))), "panoramas:", len(list(PANOS.glob('*.png'))))

