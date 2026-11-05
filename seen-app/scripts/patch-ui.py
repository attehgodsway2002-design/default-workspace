"""Targeted UI/seed fixes applied with explicit UTF-8 I/O."""
import io
import re
import sys
import pathlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
root = pathlib.Path("src")

def patch(path: pathlib.Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if old not in text:
        print("MISS", path, old[:60])
        return
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print("ok  ", path)

# 1. "Billboard spot" only on Billboard tier
patch(
    root / "components/consumer/merchant-card.tsx",
    '{featured && <span className="text-sun-600">Billboard spot</span>}',
    '{featured && merchant.tier === "billboard" && (\n                <span className="text-sun-600">Billboard spot</span>\n              )}',
)

# 2. Drop the clipped floating "Demo merchant" card over the hero
hero = root / "app/page.tsx"
text = hero.read_text(encoding="utf-8")
floating = re.search(
    r'\n\s*<div className="absolute -right-6 top-8 hidden rotate-2.*?</div>\n\s*</div>\n',
    text,
    re.S,
)
if floating:
    text = text.replace(floating.group(0), "\n")
    hero.write_text(text, encoding="utf-8")
    print("ok   removed hero floating card")
else:
    print("MISS hero floating card")

# 3. Pending merchants should look freshly submitted in the ops queue
patch(
    root / "lib/db/seed.ts",
    """  for (const pending of merchants.slice(-3)) {
    pending.status = "pending";
    pending.tier = "starter";
    pending.slotId = undefined;
  }""",
    """  merchants.slice(-3).forEach((pending, index) => {
    pending.status = "pending";
    pending.tier = "starter";
    pending.slotId = undefined;
    // Fresh submissions: the ops queue is a working list, not an archive.
    pending.createdAt = new Date(now.getTime() - (index + 1) * 43_200_000 - 3_600_000).toISOString();
  });""",
)
