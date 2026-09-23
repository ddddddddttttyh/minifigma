import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Corner, Shape as ShapeModel } from '../types/shape'

interface ShapeProps {
  shape: Omit<ShapeModel, 'id'> & { id?: string }
  selected: boolean
  interactive?: boolean
  resizable?: boolean
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void
  onHandlePointerDown?: (corner: Corner, e: ReactPointerEvent<HTMLDivElement>) => void
}

const HANDLE = 9

const HANDLES: { corner: Corner; fx: (w: number) => number; fy: (h: number) => number }[] = [
  { corner: 'nw', fx: () => 0, fy: () => 0 },
  { corner: 'ne', fx: (w) => w, fy: () => 0 },
  { corner: 'sw', fx: () => 0, fy: (h) => h },
  { corner: 'se', fx: (w) => w, fy: (h) => h },
]

const CURSORS: Record<Corner, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
}

export default function Shape({
  shape,
  selected,
  interactive = false,
  resizable = false,
  onPointerDown,
  onHandlePointerDown,
}: ShapeProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    borderRadius: shape.type === 'ellipse' ? '50%' : undefined,
    background: shape.fill ?? '#a5b4fc',
    pointerEvents: interactive ? 'auto' : 'none',
    cursor: interactive ? 'move' : undefined,
  }

  return (
    <>
      <div
        style={style}
        onPointerDown={interactive ? onPointerDown : undefined}
      />
      {selected && (
        <div
          className="absolute"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.width,
            height: shape.height,
            outline: '1px solid #6366f1',
            pointerEvents: 'none',
          }}
        >
          {HANDLES.map(({ corner, fx, fy }) => (
            <div
              key={corner}
              className="absolute rounded-[1px] border border-indigo-500 bg-white"
              style={{
                left: fx(shape.width) - HANDLE / 2,
                top: fy(shape.height) - HANDLE / 2,
                width: HANDLE,
                height: HANDLE,
                pointerEvents: resizable ? 'auto' : 'none',
                cursor: CURSORS[corner],
              }}
              onPointerDown={
                resizable ? (e) => onHandlePointerDown?.(corner, e) : undefined
              }
            />
          ))}
        </div>
      )}
    </>
  )
}
