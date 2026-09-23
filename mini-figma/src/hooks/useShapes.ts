import { useCallback, useEffect, useRef, useState } from 'react'
import type { Corner, DraftShape, Point, Shape, ShapeType } from '../types/shape'
import { normalizeRect, translatePoint } from '../utils/geometry'

const DEFAULT_FILL = '#a5b4fc'

function createId(): string {
  return Math.random().toString(36).slice(2, 10)
}

interface DragState {
  origins: Record<string, Point>
  last: Point
  snapshot: Shape[]
  moved: boolean
}

interface ResizeState {
  id: string
  corner: Corner
  anchor: Point
  last: Point
  snapshot: Shape
}

const MAX_HISTORY = 100

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [draft, setDraft] = useState<DraftShape | null>(null)
  const draftRef = useRef<DraftShape | null>(null)
  const shapesRef = useRef<Shape[]>([])
  const dragRef = useRef<DragState | null>(null)
  const resizeRef = useRef<ResizeState | null>(null)
  const pastRef = useRef<Shape[][]>([])
  const futureRef = useRef<Shape[][]>([])

  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  const pushHistory = useCallback((snapshot: Shape[]) => {
    pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), snapshot]
    futureRef.current = []
  }, [])

  const applyChange = useCallback(
    (updater: (prev: Shape[]) => Shape[]) => {
      pushHistory(shapesRef.current)
      setShapes(updater)
    },
    [pushHistory],
  )

  const undo = useCallback(() => {
    const past = pastRef.current
    if (past.length === 0) return
    const previous = past[past.length - 1]
    pastRef.current = past.slice(0, -1)
    futureRef.current = [...futureRef.current, shapesRef.current]
    setShapes(previous)
    const exists = new Set(previous.map((s) => s.id))
    setSelectedIds((ids) => ids.filter((id) => exists.has(id)))
  }, [])

  const redo = useCallback(() => {
    const future = futureRef.current
    if (future.length === 0) return
    const next = future[future.length - 1]
    futureRef.current = future.slice(0, -1)
    pastRef.current = [...pastRef.current, shapesRef.current]
    setShapes(next)
    const exists = new Set(next.map((s) => s.id))
    setSelectedIds((ids) => ids.filter((id) => exists.has(id)))
  }, [])

  const addShape = useCallback(
    (shape: Omit<Shape, 'id'>) => {
      const id = createId()
      applyChange((prev) => [...prev, { fill: DEFAULT_FILL, ...shape, id }])
      setSelectedIds([id])
      return id
    },
    [applyChange],
  )

  const updateShape = useCallback(
    (id: string, patch: Partial<Omit<Shape, 'id'>>) => {
      applyChange((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    },
    [applyChange],
  )

  const select = useCallback((ids: string[]) => {
    setSelectedIds(ids)
  }, [])

  const deselect = useCallback(() => {
    setSelectedIds([])
  }, [])

  const startDrag = useCallback((ids: string[], point: Point): boolean => {
    const origins: Record<string, Point> = {}
    for (const s of shapesRef.current) {
      if (ids.includes(s.id)) origins[s.id] = { x: s.x, y: s.y }
    }
    const count = Object.keys(origins).length
    if (count === 0) return false
    dragRef.current = { origins, last: point, snapshot: shapesRef.current, moved: false }
    return true
  }, [])

  const moveDrag = useCallback((point: Point) => {
    const drag = dragRef.current
    if (!drag) return
    const last = drag.last
    const dx = point.x - last.x
    const dy = point.y - last.y
    if (dx !== 0 || dy !== 0) dragRef.current = { ...drag, last: point, moved: true }
    setShapes((prev) =>
      prev.map((s) => {
        const origin = drag.origins[s.id]
        if (!origin) return s
        const next = translatePoint(origin, { x: dx, y: dy })
        return { ...s, x: next.x, y: next.y }
      }),
    )
  }, [])

  const endDrag = useCallback(() => {
    const drag = dragRef.current
    dragRef.current = null
    if (drag && drag.moved) pushHistory(drag.snapshot)
  }, [pushHistory])

  const deleteSelected = useCallback(() => {
    const ids = selectedIds
    if (ids.length === 0) return
    applyChange((prev) => prev.filter((s) => !ids.includes(s.id)))
    setSelectedIds([])
  }, [selectedIds, applyChange])

  const startResize = useCallback((id: string, corner: Corner, point: Point): boolean => {
    const shape = shapesRef.current.find((s) => s.id === id)
    if (!shape) return false
    const anchor: Point =
      corner === 'nw'
        ? { x: shape.x + shape.width, y: shape.y + shape.height }
        : corner === 'ne'
          ? { x: shape.x, y: shape.y + shape.height }
          : corner === 'sw'
            ? { x: shape.x + shape.width, y: shape.y }
      : { x: shape.x, y: shape.y }
    resizeRef.current = { id, corner, anchor, last: point, snapshot: shape }
    return true
  }, [])

  const moveResize = useCallback((point: Point) => {
    const resize = resizeRef.current
    if (!resize) return
    resizeRef.current = { ...resize, last: point }
    const { id, anchor } = resize
    const rect = normalizeRect(anchor, point)
    setShapes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, x: rect.x, y: rect.y, width: rect.width, height: rect.height } : s,
      ),
    )
  }, [])

  const endResize = useCallback(() => {
    const resize = resizeRef.current
    if (!resize) return
    resizeRef.current = null
    const shape = shapesRef.current.find((s) => s.id === resize.id)
    if (!shape || shape.width !== resize.snapshot.width || shape.height !== resize.snapshot.height) {
      pushHistory([resize.snapshot].concat(shapesRef.current.filter((s) => s.id !== resize.id)))
    }
    if (shape && (shape.width < 2 || shape.height < 2)) {
      setShapes((prev) => prev.filter((s) => s.id !== resize.id))
      setSelectedIds([])
    }
  }, [pushHistory])

  const startDrawing = useCallback((type: ShapeType, point: Point) => {
    const d: DraftShape = { type, x: point.x, y: point.y, width: 0, height: 0, fill: DEFAULT_FILL }
    draftRef.current = d
    setDraft(d)
  }, [])

  const moveDrawing = useCallback((point: Point) => {
    const d = draftRef.current
    if (!d) return
    const next = { ...d, ...normalizeRect(d, point) }
    draftRef.current = next
    setDraft(next)
  }, [])

  const commitDrawing = useCallback(() => {
    const d = draftRef.current
    draftRef.current = null
    setDraft(null)
    if (!d || d.width < 2 || d.height < 2) return
    const id = createId()
    applyChange((prev) => [...prev, { ...d, id }])
    setSelectedIds([id])
  }, [applyChange])

  const cancelDrawing = useCallback(() => {
    draftRef.current = null
    setDraft(null)
  }, [])

  return {
    shapes,
    selectedIds,
    draft,
    undo,
    redo,
    addShape,
    updateShape,
    select,
    deselect,
    startDrag,
    moveDrag,
    endDrag,
    deleteSelected,
    startResize,
    moveResize,
    endResize,
    startDrawing,
    moveDrawing,
    commitDrawing,
    cancelDrawing,
  }
}
