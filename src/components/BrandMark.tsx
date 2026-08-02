const CELLS: [number, number][] = [
  [0, 0], [2, 0], [4, 0],
  [0, 1], [2, 1], [4, 1],
  [0, 2], [2, 2], [4, 2],
  [0, 3], [1, 3], [2, 3], [3, 3], [4, 3],
  [0, 4], [2, 4], [4, 4],
  [0, 5], [2, 5], [4, 5],
  [0, 6], [2, 6], [4, 6],
]

export function BrandMark() {
  return (
    <svg className="brand-mark-svg" viewBox="0 0 48 48" aria-hidden="true">
      {CELLS.map(([c, r]) => (
        <rect
          key={`${c}-${r}`}
          x={9 + c * 6}
          y={3 + r * 6}
          width={6}
          height={6}
          rx={1.4}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}
