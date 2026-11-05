"""Repair UTF-8 mojibake introduced by a PowerShell Get-Content/Set-Content round-trip."""
import io
import pathlib
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

PAIRS = [
    ("GH\u00e2\u201a\u00b5", "GH\u20b5"),   # GHâ‚µ -> GH₵
    ("\u00e2\u201a\u00b5", "\u20b5"),        # â‚µ  -> ₵
    ("\u00e2\u20ac\u201d", "\u2014"),        # â€” -> —
    ("\u00e2\u20ac\u201c", "\u2013"),        # â€“ -> –
    ("\u00e2\u20ac\u2122", "\u2019"),        # â€™ -> ’
    ("\u00e2\u20ac\u0153", "\u201c"),        # â€œ -> “
    ("\u00e2\u20ac\u009d", "\u201d"),        # â€  -> ”
    ("\u00e2\u20ac\u00a6", "\u2026"),        # â€¦ -> …
    ("\u00c2\u00b7", "\u00b7"),              # Â·  -> ·
    ("\u00c2\u00a0", " "),                   # Â   -> space
    ("\u00e2\u0153\u201c", "\u2713"),        # âœ“ -> ✓
]

root = pathlib.Path("src")
fixed = 0
for path in list(root.rglob("*.ts")) + list(root.rglob("*.tsx")) + list(root.rglob("*.css")):
    text = path.read_text(encoding="utf-8")
    original = text
    for bad, good in PAIRS:
        text = text.replace(bad, good)
    if text != original:
        path.write_text(text, encoding="utf-8")
        fixed += 1
        print("fixed", path)

print("files repaired:", fixed)
