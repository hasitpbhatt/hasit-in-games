const FROG_GRID = [
  '....GGGGGG....',
  '..GGGGGGGGGG..',
  '.GWWWGGGGWWWG.',
  '.GWWWGGGGWWWG.',
  '.GDDDGGGGDDDG.',
  '.GGGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '.GG.GGGGGG.GG.',
  '..GGGGGGGGGG..',
  '..G........G..',
  '....GGGGGG....',
]

const CELL = 4
const COLORS: Record<string, string> = {
  G: '#22c55e',
  W: '#f0fdf4',
  D: '#052e16',
}

interface FrogMascotProps {
  className?: string
}

export function FrogMascot({ className }: FrogMascotProps) {
  const rects: React.ReactNode[] = []
  FROG_GRID.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.') continue
      rects.push(
        <rect key={`${x}-${y}`} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={COLORS[ch]} />,
      )
    }
  })
  return (
    <svg className={className} viewBox="0 0 56 48" aria-hidden="true">
      {rects}
    </svg>
  )
}
