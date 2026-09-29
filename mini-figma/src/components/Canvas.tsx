import { useEffect, useState, useRef, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { useViewport } from '../hooks/useViewport'
import type { ShapesApi } from '../hooks/useShapes'
import type { Corner, Rect as RectModel, Tool } from '../types/shape'
import { clampZoom, screenToCanvas } from '../utils/geometry'
import Shape from './Shape'

interface CanvasProps {
  tool: Tool
  shapes: ShapesApi
}

export default function Canvas({ tool, shapes }: CanvasProps) {
  const {
    viewport,
    isPanning,
    canvasRef,
    getCanvasRect,
    startPan,
    movePan,
    endPan,
    handleWheel,
    setZoom,
    setView,
  } = useViewport()

  const isSpaceDown = useRef(false)
  const isDragging = useRef(false)
  const isDrawing = useRef(false)
  const isMoving = useRef(false)
  const isResizing = useRef(false)
  const isMarquee = useRef(false)
  const marqueeStart = useRef<{ x: number; y: number } | null>(null)
  const [marquee, setMarquee] = useState<RectModel | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  function intersects(a: RectModel, b: RectModel): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    const rect = getCanvasRect()
    if (!rect) return
    const point = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect)

    if (isSpaceDown.current) {
      startPan(e.clientX, e.clientY)
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    if (tool === 'rectangle' || tool === 'ellipse' || tool === 'text') {
      shapes.startDrawing(tool, point)
      isDrawing.current = true
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    if (!editingId) {
      shapes.select([])
      marqueeStart.current = point
      isMarquee.current = true
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  function onShapePointerDown(shapeId: string) {
    return (e: ReactPointerEvent<HTMLDivElement>) => {
      if (tool !== 'select' || e.button !== 0) return
      if (editingId === shapeId) return
      e.stopPropagation()
      const rect = getCanvasRect()
      if (!rect) return
      const point = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect)

      const ids = e.shiftKey
        ? shapes.selectedIds.includes(shapeId)
          ? shapes.selectedIds.filter((id) => id !== shapeId)
          : [...shapes.selectedIds, shapeId]
        : shapes.selectedIds.includes(shapeId)
          ? shapes.selectedIds
          : [shapeId]
      shapes.select(ids)

      if (shapes.startDrag(ids, point)) {
        isMoving.current = true
        isDragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }
    }
  }

  function onShapeDoubleClick(shapeId: string) {
    return () => {
      if (tool !== 'select') return
      const shape = shapes.shapes.find((s) => s.id === shapeId)
      if (shape?.type === 'text') {
        shapes.select([shapeId])
        setEditingId(shapeId)
      }
    }
  }

  function onHandlePointerDown(shapeId: string) {
    return (corner: Corner, e: ReactPointerEvent<HTMLDivElement>) => {
      if (tool !== 'select' || e.button !== 0) return
      e.stopPropagation()
      const rect = getCanvasRect()
      if (!rect) return
      const point = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect)
      shapes.select([shapeId])
      if (shapes.startResize(shapeId, corner, point)) {
        isResizing.current = true
        isDragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return
    if (isSpaceDown.current) {
      movePan(e.clientX, e.clientY)
      return
    }
    const rect = getCanvasRect()
    if (!rect) return
    const point = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect)
    if (isDrawing.current) {
      shapes.moveDrawing(point, e.shiftKey)
    }
    if (isMoving.current) {
      shapes.moveDrag(point)
    }
    if (isResizing.current) {
      shapes.moveResize(point)
    }
    if (isMarquee.current && marqueeStart.current) {
      setMarquee({
        x: Math.min(marqueeStart.current.x, point.x),
        y: Math.min(marqueeStart.current.y, point.y),
        width: Math.abs(point.x - marqueeStart.current.x),
        height: Math.abs(point.y - marqueeStart.current.y),
      })
    }
  }

  function onPointerUp() {
    if (!isDragging.current) return
    if (isSpaceDown.current) endPan()
    if (isDrawing.current) {
      const createdId = shapes.commitDrawing()
      isDrawing.current = false
      if (tool === 'text' && createdId) {
        setEditingId(createdId)
      }
    }
    if (isMoving.current) {
      shapes.endDrag()
      isMoving.current = false
    }
    if (isResizing.current) {
      shapes.endResize()
      isResizing.current = false
    }
    if (isMarquee.current) {
      if (marquee && marquee.width > 2 && marquee.height > 2) {
        const ids = shapes.shapes
          .filter((s) => intersects(marquee, s))
          .map((s) => s.id)
        shapes.select(ids)
      }
      isMarquee.current = false
      marqueeStart.current = null
      setMarquee(null)
    }
    isDragging.current = false
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        if (key === '=' || key === '+') {
          e.preventDefault()
          setZoom(viewport.zoom * 1.1)
        } else if (key === '-') {
          e.preventDefault()
          setZoom(viewport.zoom / 1.1)
        } else if (key === '0') {
          e.preventDefault()
          zoomToFit()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function zoomToFit() {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || shapes.shapes.length === 0) {
      setZoom(1)
      return
    }
    const minX = Math.min(...shapes.shapes.map((s) => s.x))
    const maxX = Math.max(...shapes.shapes.map((s) => s.x + s.width))
    const minY = Math.min(...shapes.shapes.map((s) => s.y))
    const maxY = Math.max(...shapes.shapes.map((s) => s.y + s.height))
    const width = Math.max(maxX - minX, 100)
    const height = Math.max(maxY - minY, 100)
    const zoom = clampZoom(Math.min((rect.width - 160) / width, (rect.height - 160) / height))
    setView({
      zoom,
      scrollX: rect.width / 2 - zoom * (minX + width / 2),
      scrollY: rect.height / 2 - zoom * (minY + height / 2),
    })
  }

  return (
    <div
      ref={canvasRef}
      className="relative h-full w-full overflow-hidden bg-white"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={(e: ReactWheelEvent<HTMLDivElement>) => {
        const event = e.nativeEvent
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const native = event as WheelEvent
        Object.defineProperty(native, 'clientX', { value: e.clientX })
        Object.defineProperty(native, 'clientY', { value: e.clientY })
        handleWheel(native)
      }}
      style={{
        cursor: isPanning ? 'grabbing' : tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.scrollX}px ${viewport.scrollY}px`,
        }}
      />
      <div
        data-viewport
        className="absolute top-0 left-0 w-px h-px"
        style={{ transform: `translate(${viewport.scrollX}px, ${viewport.scrollY}px) scale(${viewport.zoom})` }}
      >
        {shapes.shapes.map((shape) => (
          <Shape
            key={shape.id}
            shape={shape}
            selected={shapes.selectedIds.includes(shape.id)}
            interactive={tool === 'select'}
            resizable={tool === 'select' && shapes.selectedIds.length === 1}
            editing={editingId === shape.id}
            onPointerDown={onShapePointerDown(shape.id)}
            onHandlePointerDown={onHandlePointerDown(shape.id)}
            onDoubleClick={onShapeDoubleClick(shape.id)}
            onTextCommit={(value) => {
              if (value.trim() === '') {
                shapes.deleteSelected()
              } else {
                shapes.updateShape(shape.id, { text: value })
              }
              setEditingId(null)
            }}
          />
        ))}
        {shapes.draft && <Shape shape={shapes.draft} selected={false} />}
        {marquee && (
          <div
            className="absolute border border-indigo-500 bg-indigo-500/10"
            style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height }}
          />
        )}
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 text-xs shadow-sm select-none">
        <button
          type="button"
          title="Приблизить (Ctrl +)"
          onClick={() => setZoom(viewport.zoom * 1.1)}
          className="h-6 w-6 rounded hover:bg-zinc-100"
        >
          +
        </button>
        <span className="w-12 text-center tabular-nums text-zinc-600">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          type="button"
          title="Отдалить (Ctrl −)"
          onClick={() => setZoom(viewport.zoom / 1.1)}
          className="h-6 w-6 rounded hover:bg-zinc-100"
        >
          −
        </button>
        <button
          type="button"
          title="Показать всё (Ctrl 0)"
          onClick={zoomToFit}
          className="h-6 w-9 rounded font-medium hover:bg-zinc-100"
        >
          Fit
        </button>
      </div>
    </div>
  )
}

