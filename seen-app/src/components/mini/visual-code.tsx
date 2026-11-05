const SIZE = 21;
const CELL = 6;

function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inFinder(row: number, column: number): boolean {
  return (
    (row < 7 && column < 7) ||
    (row < 7 && column >= SIZE - 7) ||
    (row >= SIZE - 7 && column < 7)
  );
}

/**
 * Deterministic entry-code block derived from the ticket reference.
 * It is deliberately decorative: this is NOT a scannable QR code and the UI
 * never claims otherwise.
 */
export function VisualCode({ reference, className }: { reference: string; className?: string }) {
  const random = mulberry32(hash32(reference));
  const cells: { row: number; column: number }[] = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      if (inFinder(row, column)) continue;
      if (random() > 0.52) cells.push({ row, column });
    }
  }

  const finderOrigins = [
    { row: 0, column: 0 },
    { row: 0, column: SIZE - 7 },
    { row: SIZE - 7, column: 0 },
  ];

  return (
    <svg
      viewBox={`0 0 ${SIZE * CELL} ${SIZE * CELL}`}
      className={className ?? "h-40 w-40"}
      role="img"
      aria-label={`Entry code ${reference}. Decorative pattern, not a scannable QR code.`}
    >
      <rect width={SIZE * CELL} height={SIZE * CELL} fill="#FFFFFF" />
      {cells.map((cell) => (
        <rect
          key={`${cell.row}-${cell.column}`}
          x={cell.column * CELL}
          y={cell.row * CELL}
          width={CELL}
          height={CELL}
          fill="#0B2E4A"
        />
      ))}
      {finderOrigins.map((origin) => (
        <g key={`${origin.row}-${origin.column}`}>
          <rect
            x={(origin.column + 1) * CELL}
            y={(origin.row + 1) * CELL}
            width={5 * CELL}
            height={5 * CELL}
            fill="#FFFFFF"
          />
          <rect
            x={origin.column * CELL}
            y={origin.row * CELL}
            width={7 * CELL}
            height={7 * CELL}
            fill="none"
            stroke="#0B2E4A"
            strokeWidth={CELL}
          />
          <rect
            x={(origin.column + 2) * CELL}
            y={(origin.row + 2) * CELL}
            width={3 * CELL}
            height={3 * CELL}
            fill="#0B2E4A"
          />
        </g>
      ))}
    </svg>
  );
}
