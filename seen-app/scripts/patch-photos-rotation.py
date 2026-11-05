import io
import pathlib
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
p = pathlib.Path("src/lib/db/seed.ts")
t = p.read_text(encoding="utf-8")

helper = '''
/** Rotate a photo set so neighbouring storefronts do not render the same plate. */
function rotate<T>(items: T[], by: number): T[] {
  if (items.length === 0) return items;
  const k = ((by % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}
'''

anchor = "const LANDMARKS: Record<Corridor[\"id\"], string[]> = {"
if helper.strip() not in t:
    t = t.replace(anchor, helper.strip() + "\n\n" + anchor, 1)

old = "      photos: PHOTO_SETS[brand.categoryId],"
new = "      photos: rotate(PHOTO_SETS[brand.categoryId], index + (brand.branches ?? 1)),"
if old in t:
    t = t.replace(old, new, 1)
    print("photo rotation enabled")
else:
    print("MISS photo assignment")

p.write_text(t, encoding="utf-8")
print("done")
