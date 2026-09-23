interface LayersPanelProps {
  shapes: { id: string; type: 'rectangle' | 'ellipse'; width: number; height: number }[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
}

const LABELS: Record<'rectangle' | 'ellipse', string> = {
  rectangle: 'Прямоугольник',
  ellipse: 'Эллипс',
}

export default function LayersPanel({ shapes, selectedIds, onSelect }: LayersPanelProps) {
  const items = [...shapes].reverse()
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.type, (counts.get(item.type) ?? 0) + 1)
  }
  const lastNameIndex = new Map<string, number>()

  return (
    <div className="h-full w-56 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white p-3 text-sm text-zinc-700">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Слои
      </div>
      {items.length === 0 ? (
        <p className="text-zinc-400">Нет фигур</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((shape) => {
            const index = lastNameIndex.get(shape.type) ?? 0
            lastNameIndex.set(shape.type, index + 1)
            const label = `${LABELS[shape.type]} ${counts.get(shape.type)! - index}`
            const selected = selectedIds.includes(shape.id)
            return (
              <li key={shape.id}>
                <button
                  type="button"
                  onClick={() => onSelect([shape.id])}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                    selected ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-zinc-50'
                  }`}
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-[3px] ${
                      shape.type === 'ellipse' ? 'rounded-full' : ''
                    } ${selected ? 'bg-indigo-500' : 'bg-zinc-300'}`}
                  />
                  <span className="truncate">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
