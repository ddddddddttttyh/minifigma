import type { ReactNode } from 'react'
import type { ShapesApi } from '../hooks/useShapes'

interface PropertiesPanelProps {
  shapes: ShapesApi
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-zinc-500">{label}</span>
      {children}
    </div>
  )
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={Math.round(value)}
      onChange={(e) => {
        const next = Number(e.target.value)
        if (Number.isFinite(next)) onChange(next)
      }}
      className="w-20 rounded border border-zinc-200 px-1.5 py-0.5 text-xs tabular-nums focus:border-indigo-400 focus:outline-none"
    />
  )
}


export default function PropertiesPanel({ shapes }: PropertiesPanelProps) {
  const selected = shapes.shapes.find((s) => s.id === shapes.selectedIds[0])
  const multi = shapes.selectedIds.length > 1

  return (
    <div className="flex h-full w-56 shrink-0 flex-col gap-2 border-l border-zinc-200 bg-white p-3 text-sm text-zinc-700">
      {selected ? (
        <>
          {multi && <span className="text-xs font-semibold text-zinc-400">Выбрано: {shapes.selectedIds.length}</span>}
          <Row label="X">
            <NumInput value={selected.x}  onChange={(v) => shapes.updateShape(selected.id, { x: v })} />
          </Row>
          <Row label="Y">
            <NumInput value={selected.y}  onChange={(v) => shapes.updateShape(selected.id, { y: v })} />
          </Row>
          <Row label="Ш">
            <NumInput value={selected.width}  onChange={(v) => shapes.updateShape(selected.id, { width: v })} />
          </Row>
          <Row label="В">
            <NumInput value={selected.height}  onChange={(v) => shapes.updateShape(selected.id, { height: v })} />
          </Row>

          <hr className="border-zinc-100" />

          {selected.type === 'text' ? (
            <Row label="Размер шрифта">
              <NumInput
                value={selected.fontSize ?? 20}
                
                onChange={(v) => shapes.updateShape(selected.id, { fontSize: v })}
              />
            </Row>
          ) : (
            <Row label="Радиус">
              <NumInput
                value={selected.radius ?? 0}
                
                onChange={(v) => shapes.updateShape(selected.id, { radius: Math.max(0, v) })}
              />
            </Row>
          )}

          <div>
            <span className="text-zinc-500">Заливка</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={selected.fill ?? '#a5b4fc'}
                onChange={(e) => shapes.updateShape(selected.id, { fill: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded border border-zinc-200 bg-white"
                title="Цвет"
              />
              <span className="text-xs text-zinc-400">{selected.fill ?? '—'}</span>
            </div>
          </div>
          {selected.type !== 'text' && (
            <Row label="Обводка">
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={selected.stroke ?? '#18181b'}
                  onChange={(e) => shapes.updateShape(selected.id, { stroke: e.target.value })}
                  className="h-7 w-8 cursor-pointer rounded border border-zinc-200 bg-white"
                  title="Цвет обводки"
                />
                <NumInput
                  value={selected.strokeWidth ?? 0}
                  
                  onChange={(v) => shapes.updateShape(selected.id, { strokeWidth: Math.max(0, v) })}
                />
              </div>
            </Row>
          )}
          <Row label="Прозрачность">
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={0}
                max={100}
                value={(selected.opacity ?? 1) * 100}
                onChange={(e) => shapes.updateShape(selected.id, { opacity: Number(e.target.value) / 100 })}
                className="w-24 accent-indigo-500"
              />
              <span className="w-8 text-right text-xs tabular-nums text-zinc-500">{Math.round((selected.opacity ?? 1) * 100)}%</span>
            </div>
          </Row>

          <hr className="border-zinc-100" />

          <div>
            <span className="text-zinc-500">Порядок</span>
            <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
              <button
                type="button"
                onClick={shapes.bringToFront}
                className="rounded border border-zinc-200 py-1 hover:bg-zinc-50"
              >
                Вперёд
              </button>
              <button
                type="button"
                onClick={shapes.sendToBack}
                className="rounded border border-zinc-200 py-1 hover:bg-zinc-50"
              >
                Назад
              </button>
            </div>
          </div>

          <div>
            <span className="text-zinc-500">Выравнивание</span>
            <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
              {(
                [
                  ['left', '—◀'],
                  ['hcenter', '⇢'],
                  ['right', '▶—'],
                  ['top', '—▲'],
                  ['vcenter', '⇡'],
                  ['bottom', '—▼'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  disabled={shapes.selectedIds.length < 2}
                  onClick={() => shapes.alignSelection(mode)}
                  className="rounded border border-zinc-200 bg-white py-1 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-zinc-400">Свойства появятся при выборе фигуры</div>
      )}
    </div>
  )
}



