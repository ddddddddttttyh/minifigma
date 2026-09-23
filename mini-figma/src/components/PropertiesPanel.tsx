import type { useShapes } from '../hooks/useShapes'

interface PropertiesPanelProps {
  shapes: ReturnType<typeof useShapes>
}

const COLORS = ['#a5b4fc', '#fca5a5', '#86efac', '#fcd34d', '#93c5fd', '#f9a8d4', '#d4d4d8']

export default function PropertiesPanel({ shapes }: PropertiesPanelProps) {
  const selected = shapes.shapes.find((s) => s.id === shapes.selectedIds[0])

  if (!selected) {
    return (
      <div className="h-full w-56 shrink-0 border-l border-zinc-200 bg-white p-3 text-sm text-zinc-500">
        Свойства (каркас)
      </div>
    )
  }

  return (
    <div className="flex h-full w-56 shrink-0 flex-col gap-2 border-l border-zinc-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-700">Заливка</span>
        <input
          type="color"
          value={selected.fill ?? '#a5b4fc'}
          onChange={(e) => shapes.updateShape(selected.id, { fill: e.target.value })}
          className="h-7 w-10 cursor-pointer rounded border border-zinc-200 bg-white"
          title="Цвет заливки"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => shapes.updateShape(selected.id, { fill: c })}
            className={`h-6 w-6 rounded border ${
              (selected.fill ?? '#a5b4fc') === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-zinc-200'
            }`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  )
}
