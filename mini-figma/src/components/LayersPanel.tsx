import { useState } from 'react'
import type { Shape, ShapeType } from '../types/shape'

interface LayersPanelProps {
  shapes: Shape[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onRename: (id: string, name: string) => void
}

const LABELS: Record<ShapeType, string> = {
  rectangle: 'Прямоугольник',
  ellipse: 'Эллипс',
  text: 'Текст',
}

export default function LayersPanel({ shapes, selectedIds, onSelect, onRename }: LayersPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const items = [...shapes].reverse()
  const counts = new Map<ShapeType, number>()
  for (const item of items) {
    counts.set(item.type, (counts.get(item.type) ?? 0) + 1)
  }
  const lastNameIndex = new Map<ShapeType, number>()

  return (
    <div className="h-full w-56 shrink-0 border-l border-zinc-200 bg-white p-3 text-sm text-zinc-700">
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
            const autoLabel = `${LABELS[shape.type]} ${counts.get(shape.type)! - index}`
            const label = shape.name ?? autoLabel
            const selected = selectedIds.includes(shape.id)
            return (
              <li key={shape.id}>
                {renamingId === shape.id ? (
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => {
                      onRename(shape.id, draftName)
                      setRenamingId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    className="w-full rounded border border-indigo-400 px-2 py-1.5 text-xs focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect([shape.id])}
                    onDoubleClick={() => {
                      setDraftName(shape.name ?? '')
                      setRenamingId(shape.id)
                    }}
                    title="Двойной клик — переименовать"
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                      selected ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <span
                      className={`h-3 w-3 shrink-0 ${
                        shape.type === 'ellipse' ? 'rounded-full' : 'rounded-[3px]'
                      } ${selected ? 'bg-indigo-500' : 'bg-zinc-300'}`}
                    />
                    <span className="truncate">{label}</span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
