import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { Corner, Shape as ShapeModel } from '../types/shape'

interface ShapeProps {
  shape: Omit<ShapeModel, 'id'> & { id?: string }
  selected: boolean
  interactive?: boolean
  resizable?: boolean
  editing?: boolean
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void
  onHandlePointerDown?: (corner: Corner, e: ReactPointerEvent<HTMLDivElement>) => void
  onDoubleClick?: (e: ReactMouseEvent<HTMLDivElement>) => void
  onTextCommit?: (value: string) => void
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
  editing = false,
  onPointerDown,
  onHandlePointerDown,
  onDoubleClick,
  onTextCommit,
}: ShapeProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    background: shape.type === 'text' ? undefined : (shape.fill ?? '#a5b4fc'),
    border:
      shape.strokeWidth && shape.strokeWidth > 0 && shape.stroke
        ? `${shape.strokeWidth}px solid ${shape.stroke}`
        : undefined,
    borderRadius: shape.type === 'ellipse' ? '50%' : shape.radius ? shape.radius : undefined,
    opacity: shape.opacity ?? 1,
    pointerEvents: interactive && !editing ? 'auto' : 'none',
    cursor: interactive ? 'move' : undefined,
  }

  const textStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: shape.fontSize ?? 20,
    lineHeight: 1.3,
    color: shape.fill ?? '#18181b',
    outline: 'none',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  }

  return (
    <>
      <div style={style} onDoubleClick={interactive ? onDoubleClick : undefined}>
        {shape.type === 'text' && (
          <div
            contentEditable={editing}
            suppressContentEditableWarning
            spellCheck={false}
            className="h-full w-full"
            style={{
              ...textStyle,
              pointerEvents: editing ? 'auto' : undefined,
              cursor: editing ? 'text' : undefined,
              borderBottom: editing ? '1px dashed #6366f1' : undefined,
            }}
            onBlur={(e) => {
              if (editing && onTextCommit) onTextCommit(e.currentTarget.textContent ?? '')
            }}
            onKeyDown={(e) => {
              if (editing && e.key === 'Escape') {
                e.currentTarget.blur()
              }
            }}
          >
            {editing ? undefined : shape.text}
          </div>
        )}
      </div>
      {shape.type === 'text' && !editing && (
        <div
          style={{
            position: 'absolute',
            left: shape.x,
            top: shape.y,
            width: shape.width,
            height: shape.height,
            pointerEvents: interactive && !editing ? 'auto' : 'none',
            cursor: interactive ? 'move' : undefined,
          }}
          onPointerDown={interactive ? onPointerDown : undefined}
          onDoubleClick={interactive ? onDoubleClick : undefined}
        />
      )}
      {selected && (
        <div
          className="absolute"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.width,
            height: shape.height,
            outline: '1px solid #6366f1',
            outlineOffset: shape.strokeWidth ? shape.strokeWidth / -2 : undefined,
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
