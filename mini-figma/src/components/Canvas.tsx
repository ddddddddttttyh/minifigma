import { useRef, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { useViewport } from '../hooks/useViewport'
import { useShapes } from '../hooks/useShapes'
import type { Corner, Tool } from '../types/shape'
import { screenToCanvas } from '../utils/geometry'
import Shape from './Shape'

interface CanvasProps {
  tool: Tool
  shapes: ReturnType<typeof useShapes>
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
  } = useViewport()

  const isSpaceDown = useRef(false)
  const isDragging = useRef(false)
  const isDrawing = useRef(false)
  const isMoving = useRef(false)
  const isResizing = useRef(false)

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

    if (tool === 'rectangle' || tool === 'ellipse') {
      shapes.startDrawing(tool, point)
      isDrawing.current = true
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    shapes.select([])
  }

  function onShapePointerDown(shapeId: string) {
    return (e: ReactPointerEvent<HTMLDivElement>) => {
      if (tool !== 'select' || e.button !== 0) return
      e.stopPropagation()
      const rect = getCanvasRect()
      if (!rect) return
      const point = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect)

      const ids = e.shiftKey
        ? shapes.selectedIds.includes(shapeId)
          ? shapes.selectedIds
          : [...shapes.selectedIds, shapeId]
        : [shapeId]
      shapes.select(ids)

      if (shapes.startDrag(ids, point)) {
        isMoving.current = true
        isDragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
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
    if (isDrawing.current) {
      const rect = getCanvasRect()
      if (!rect) return
      shapes.moveDrawing(screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect))
    }
    if (isMoving.current) {
      const rect = getCanvasRect()
      if (!rect) return
      shapes.moveDrag(screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect))
    }
    if (isResizing.current) {
      const rect = getCanvasRect()
      if (!rect) return
      shapes.moveResize(screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect))
    }
  }

  function onPointerUp() {
    if (!isDragging.current) return
    if (isSpaceDown.current) endPan()
    if (isDrawing.current) {
      shapes.commitDrawing()
      isDrawing.current = false
    }
    if (isMoving.current) {
      shapes.endDrag()
      isMoving.current = false
    }
    if (isResizing.current) {
      shapes.endResize()
      isResizing.current = false
    }
    isDragging.current = false
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
        cursor: isPanning ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair',
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
            onPointerDown={onShapePointerDown(shape.id)}
            onHandlePointerDown={onHandlePointerDown(shape.id)}
          />
        ))}
        {shapes.draft && <Shape shape={shapes.draft} selected={false} />}
      </div>
    </div>
  )
}
