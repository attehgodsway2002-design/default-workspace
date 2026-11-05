"""Regenerate Seen's storefront plates as composed, category-specific scenes.

Each plate is a 1200×800 SVG: wall gradient, window light, category furniture,
floor band, vignette and film grain. Deterministic per (category, variant).
"""
import io
import pathlib
import random
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

PHOTOS = pathlib.Path("public/photos")
PHOTOS.mkdir(parents=True, exist_ok=True)

PALETTES = {
    "food": dict(wall=("#F3E3CC", "#D9A46A"), light="#FFE9C4", floor="#7A4A2A", accent="#B4552D", dark="#3B2113"),
    "beauty": dict(wall=("#F6E4E9", "#D9A3B4"), light="#FFF0F3", floor="#6B4150", accent="#A24E68", dark="#3A1E2A"),
    "repair": dict(wall=("#DDE8EF", "#8FAFC4"), light="#E8F4FF", floor="#2C3E4C", accent="#2F607A", dark="#12222D"),
    "health": dict(wall=("#E9F1EA", "#A9C9B4"), light="#F4FFF6", floor="#4E6B58", accent="#3F7A5C", dark="#1D3327"),
    "fitness": dict(wall=("#E7E4DF", "#A8A29A"), light="#FFF3E6", floor="#2A2A2A", accent="#C4661F", dark="#171717"),
    "professional": dict(wall=("#EFE8DA", "#C3B393"), light="#FFF6E4", floor="#4A3F2E", accent="#B08034", dark="#22303B"),
}


def scene(category: str, variant: int) -> str:
    p = PALETTES[category]
    rnd = random.Random(f"{category}-{variant}")
    wall_a, wall_b = p["wall"]
    v = variant % 4
    el: list[str] = []

    # window light (back layer, softly blurred)
    wx = [700, 120, 640, 160][v]
    wy = [90, 120, 80, 110][v]
    ww = [380, 460, 420, 400][v]
    wh = [400, 360, 430, 380][v]
    el.append(
        f'<g filter="url(#soft2)">'
        f'<rect x="{wx}" y="{wy}" width="{ww}" height="{wh}" rx="10" fill="{p["light"]}" opacity="0.95"/>'
        f'<rect x="{wx}" y="{wy}" width="{ww}" height="{wh}" rx="10" fill="none" stroke="{p["dark"]}" stroke-opacity="0.25" stroke-width="8"/>'
        f'</g>'
    )
    el.append(
        f'<path d="M{wx + 20} {wy + wh} L{wx + ww * 0.55:.0f} {wy + 30} L{wx + ww} {wy + wh} Z" '
        f'fill="{p["light"]}" opacity="0.28" filter="url(#soft2)"/>'
    )

    if category == "food":
        # pendants
        for i in range(3):
            cx = 260 + i * 190
            el.append(
                f'<line x1="{cx}" y1="0" x2="{cx}" y2="{120 + i * 14}" stroke="{p["dark"]}" stroke-width="3" opacity="0.6"/>'
                f'<path d="M{cx - 34} {120 + i * 14} h68 l-14 40 h-40 z" fill="{p["dark"]}" opacity="0.85"/>'
                f'<circle cx="{cx}" cy="{170 + i * 14}" r="10" fill="{p["light"]}" opacity="0.95"/>'
                f'<circle cx="{cx}" cy="{170 + i * 14}" r="26" fill="{p["light"]}" opacity="0.25" filter="url(#soft2)"/>'
            )
        # counter + plates
        el.append(f'<rect x="0" y="560" width="1200" height="240" fill="{p["floor"]}" opacity="0.95"/>')
        el.append(f'<rect x="0" y="548" width="1200" height="22" fill="{p["accent"]}" opacity="0.9"/>')
        for i in range(3):
            cx = 300 + i * 250
            el.append(
                f'<ellipse cx="{cx}" cy="600" rx="96" ry="26" fill="{p["dark"]}" opacity="0.25"/>'
                f'<ellipse cx="{cx}" cy="592" rx="86" ry="22" fill="#FBF7F0"/>'
                f'<ellipse cx="{cx}" cy="590" rx="58" ry="15" fill="{p["accent"]}" opacity="0.55"/>'
                f'<circle cx="{cx + 6}" cy="586" r="9" fill="{p["dark"]}" opacity="0.4"/>'
            )
        # stools
        for i in range(2):
            cx = 210 + i * 640
            el.append(
                f'<rect x="{cx - 46}" y="690" width="92" height="16" rx="8" fill="{p["dark"]}" opacity="0.9"/>'
                f'<rect x="{cx - 6}" y="706" width="12" height="94" fill="{p["dark"]}" opacity="0.8"/>'
            )

    elif category == "beauty":
        # mirror + bulbs
        el.append(
            f'<ellipse cx="600" cy="330" rx="270" ry="235" fill="{p["light"]}" opacity="0.85"/>'
            f'<ellipse cx="600" cy="330" rx="270" ry="235" fill="none" stroke="{p["dark"]}" stroke-width="10" opacity="0.55"/>'
            f'<ellipse cx="600" cy="330" rx="230" ry="196" fill="{wall_b}" opacity="0.55"/>'
        )
        for i in range(14):
            import math

            ang = math.pi * (0.15 + i / 17)
            bx = 600 - math.cos(ang) * 272
            by = 330 - math.sin(ang) * 238
            el.append(f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="9" fill="{p["light"]}"/>')
        # chair
        el.append(
            f'<rect x="470" y="470" width="260" height="150" rx="26" fill="{p["floor"]}" opacity="0.95"/>'
            f'<rect x="520" y="520" width="160" height="30" rx="15" fill="{p["accent"]}" opacity="0.7"/>'
            f'<rect x="590" y="620" width="20" height="180" fill="{p["dark"]}" opacity="0.85"/>'
            f'<ellipse cx="600" cy="720" rx="140" ry="26" fill="{p["dark"]}" opacity="0.35"/>'
        )
        # shelf bottles
        el.append(f'<rect x="40" y="250" width="240" height="14" fill="{p["dark"]}" opacity="0.5"/>')
        for i in range(6):
            bx = 58 + i * 36
            bh = 46 + (i * 17) % 40
            el.append(
                f'<rect x="{bx}" y="{250 - bh}" width="22" height="{bh}" rx="6" fill="{p["accent"]}" opacity="0.65"/>'
            )

    elif category == "repair":
        # pegboard
        el.append(f'<rect x="60" y="90" width="520" height="360" rx="10" fill="{p["dark"]}" opacity="0.14"/>')
        for gx in range(9):
            for gy in range(7):
                el.append(f'<circle cx="{90 + gx * 56}" cy="{120 + gy * 50}" r="3" fill="{p["dark"]}" opacity="0.25"/>')
        # tools
        el.append(f'<rect x="120" y="150" width="14" height="150" rx="6" fill="{p["dark"]}" opacity="0.75"/>')
        el.append(f'<rect x="150" y="150" width="60" height="14" rx="6" fill="{p["accent"]}" opacity="0.9"/>')
        el.append(f'<rect x="250" y="170" width="12" height="120" rx="6" fill="{p["dark"]}" opacity="0.7"/>')
        el.append(f'<circle cx="256" cy="160" r="18" fill="none" stroke="{p["dark"]}" stroke-width="8" opacity="0.7"/>')
        el.append(f'<rect x="330" y="180" width="120" height="20" rx="8" fill="{p["accent"]}" opacity="0.8"/>')
        # bench + phone under lamp
        el.append(f'<rect x="0" y="560" width="1200" height="240" fill="{p["floor"]}" opacity="0.96"/>')
        el.append(f'<rect x="0" y="546" width="1200" height="20" fill="{p["accent"]}" opacity="0.85"/>')
        el.append(
            f'<g transform="translate(700 470) rotate(-8)">'
            f'<rect width="150" height="290" rx="24" fill="#0E1A22" opacity="0.95"/>'
            f'<rect x="10" y="14" width="130" height="262" rx="16" fill="{p["light"]}" opacity="0.55"/>'
            f'</g>'
        )
        el.append(f'<circle cx="775" cy="300" r="120" fill="{p["light"]}" opacity="0.18" filter="url(#soft2)"/>')

    elif category == "health":
        # frames
        for i in range(2):
            el.append(
                f'<rect x="{80 + i * 210}" y="120" width="170" height="130" rx="8" fill="#FFFFFF" opacity="0.75"/>'
                f'<rect x="{80 + i * 210}" y="120" width="170" height="130" rx="8" fill="none" stroke="{p["dark"]}" stroke-width="6" opacity="0.35"/>'
            )
        # counter + plant
        el.append(f'<rect x="0" y="520" width="1200" height="280" fill="{p["floor"]}" opacity="0.95"/>')
        el.append(f'<rect x="0" y="505" width="1200" height="26" fill="#F7F4EE" opacity="0.95"/>')
        el.append(
            f'<rect x="820" y="640" width="120" height="90" rx="12" fill="{p["accent"]}" opacity="0.85"/>'
            f'<path d="M880 640 C 830 560 850 500 880 470 C 910 510 930 570 880 640 Z" fill="#2F6B4A" opacity="0.9"/>'
            f'<path d="M880 640 C 930 580 970 540 1000 530 C 985 585 940 625 880 640 Z" fill="#3E855C" opacity="0.85"/>'
        )
        el.append(
            f'<rect x="600" y="150" width="300" height="330" rx="14" fill="{p["light"]}" opacity="0.9"/>'
            f'<rect x="600" y="150" width="300" height="330" rx="14" fill="none" stroke="{p["dark"]}" stroke-width="8" opacity="0.3"/>'
        )

    elif category == "fitness":
        # rack uprights + barbell
        for x in (250, 830):
            el.append(f'<rect x="{x}" y="120" width="26" height="470" fill="{p["dark"]}" opacity="0.9"/>')
            el.append(f'<circle cx="{x + 13}" cy="130" r="14" fill="{p["accent"]}" opacity="0.9"/>')
        el.append(f'<rect x="150" y="300" width="780" height="18" rx="9" fill="#B9BCC0" opacity="0.95"/>')
        for x in (176, 330, 664, 818):
            el.append(f'<circle cx="{x + 60}" cy="309" r="54" fill="{p["dark"]}" opacity="0.92"/>')
            el.append(f'<circle cx="{x + 60}" cy="309" r="30" fill="{p["accent"]}" opacity="0.55"/>')
        # floor
        el.append(f'<rect x="0" y="580" width="1200" height="220" fill="{p["floor"]}" opacity="0.97"/>')
        for i in range(4):
            el.append(f'<rect x="0" y="{600 + i * 50}" width="1200" height="4" fill="#FFFFFF" opacity="0.05"/>')
        el.append(f'<ellipse cx="600" cy="640" rx="360" ry="60" fill="#000000" opacity="0.25" filter="url(#soft2)"/>')

    else:  # professional
        # window grid + desks + monitors
        el.append(
            f'<rect x="80" y="80" width="460" height="420" rx="8" fill="{p["light"]}" opacity="0.9"/>'
            f'<rect x="80" y="80" width="460" height="420" rx="8" fill="none" stroke="{p["dark"]}" stroke-width="8" opacity="0.4"/>'
            f'<line x1="310" y1="80" x2="310" y2="500" stroke="{p["dark"]}" stroke-width="7" opacity="0.35"/>'
            f'<line x1="80" y1="290" x2="540" y2="290" stroke="{p["dark"]}" stroke-width="7" opacity="0.35"/>'
        )
        for i in range(3):
            x = 120 + i * 340
            el.append(
                f'<rect x="{x}" y="560" width="280" height="18" rx="6" fill="{p["dark"]}" opacity="0.9"/>'
                f'<rect x="{x + 30}" y="578" width="14" height="120" fill="{p["dark"]}" opacity="0.8"/>'
                f'<rect x="{x + 236}" y="578" width="14" height="120" fill="{p["dark"]}" opacity="0.8"/>'
                f'<rect x="{x + 60}" y="452" width="160" height="102" rx="8" fill="#1B2733" opacity="0.92"/>'
                f'<rect x="{x + 68}" y="460" width="144" height="86" rx="4" fill="{p["light"]}" opacity="0.5"/>'
            )
        el.append(f'<rect x="0" y="590" width="1200" height="210" fill="{p["floor"]}" opacity="0.9"/>')

    # vignette + grain overlays
    el.append('<rect width="1200" height="800" fill="url(#vig)"/>')

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="{wall_a}"/>
      <stop offset="100%" stop-color="{wall_b}"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.42" r="0.78">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0B1A24" stop-opacity="0.42"/>
    </radialGradient>
    <filter id="soft2" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="grain2">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="{variant + 5}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.055"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="1200" height="800" fill="url(#wall)"/>
  {''.join(el)}
  <rect width="1200" height="800" filter="url(#grain2)" opacity="0.75"/>
</svg>
"""


count = 0
for category in PALETTES:
    for variant in range(4):
        (PHOTOS / f"{category}-{variant + 1}.svg").write_text(scene(category, variant), encoding="utf-8")
        count += 1
print("plates:", count)
