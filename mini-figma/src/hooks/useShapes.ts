import { useCallback, useEffect, useRef, useState } from 'react'
import type { Corner, DraftShape, Point, Rect, Shape, ShapeType } from '../types/shape'
import { normalizeRect, translatePoint } from '../utils/geometry'

const DEFAULT_FILL = '#a5b4fc'
const STORAGE_KEY = 'mini-figma:shapes'
const MAX_HISTORY = 100

function createId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function loadShapes(): Shape[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s): s is Shape =>
        typeof s === 'object' && s !== null && typeof (s as Shape).id === 'string',
    )
  } catch {
    return []
  }
}

interface DragState {
  origins: Record<string, Point>
  start: Point
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

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>(loadShapes)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [draft, setDraft] = useState<DraftShape | null>(null)
  const draftRef = useRef<DraftShape | null>(null)
  const shapesRef = useRef<Shape[]>([])
  const dragRef = useRef<DragState | null>(null)
  const resizeRef = useRef<ResizeState | null>(null)
  const pastRef = useRef<Shape[][]>([])
  const futureRef = useRef<Shape[][]>([])
  const clipboardRef = useRef<Shape[]>([])

  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes))
    } catch {
      // storage unavailable
    }
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

  const renameShape = useCallback((id: string, name: string) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }, [])

  const updateSelected = useCallback(
    (patch: Partial<Omit<Shape, 'id'>>) => {
      const ids = selectedIds
      if (ids.length === 0) return
      applyChange((prev) => prev.map((s) => (ids.includes(s.id) ? { ...s, ...patch } : s)))
    },
    [selectedIds, applyChange],
  )

  const select = useCallback((ids: string[]) => {
    setSelectedIds(ids)
  }, [])

  const deselect = useCallback(() => {
    setSelectedIds([])
  }, [])

  const moveSelected = useCallback((dx: number, dy: number) => {
    const ids = selectedIds
    if (ids.length === 0) return
    applyChange((prev) =>
      prev.map((s) =>
        ids.includes(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s,
      ),
    )
  }, [selectedIds, applyChange])

  const deleteSelected = useCallback(() => {
    const ids = selectedIds
    if (ids.length === 0) return
    applyChange((prev) => prev.filter((s) => !ids.includes(s.id)))
    setSelectedIds([])
  }, [selectedIds, applyChange])

  const copySelected = useCallback(() => {
    clipboardRef.current = shapesRef.current.filter((s) => selectedIds.includes(s.id))
  }, [selectedIds])

  const pasteClipboard = useCallback(() => {
    const source = clipboardRef.current
    if (source.length === 0) return
    const offset = 16
    const copies = source.map((s) => ({
      ...s,
      id: createId(),
      x: s.x + offset,
      y: s.y + offset,
    }))
    applyChange((prev) => [...prev, ...copies])
    setSelectedIds(copies.map((c) => c.id))
  }, [applyChange])

  const duplicateSelected = useCallback(() => {
    copySelected()
  }, [copySelected])

  const bringToFront = useCallback(() => {
    const ids = selectedIds
    if (ids.length === 0) return
    applyChange(
      (prev) =>
        [...prev.filter((s) => !ids.includes(s.id)), ...prev.filter((s) => ids.includes(s.id))],
    )
  }, [selectedIds, applyChange])

  const sendToBack = useCallback(() => {
    const ids = selectedIds
    if (ids.length === 0) return
    applyChange(
      (prev) =>
        [...prev.filter((s) => ids.includes(s.id)), ...prev.filter((s) => !ids.includes(s.id))],
    )
  }, [selectedIds, applyChange])

  const alignSelection = useCallback(
    (mode: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => {
      const ids = selectedIds
      const selected = shapesRef.current.filter((s) => ids.includes(s.id))
      if (selected.length < 2) return
      const minX = Math.min(...selected.map((s) => s.x))
      const maxX = Math.max(...selected.map((s) => s.x + s.width))
      const minY = Math.min(...selected.map((s) => s.y))
      const maxYReal = Math.max(...selected.map((s) => s.y + s.height))
      applyChange((prev) =>
        prev.map((s) => {
          if (!ids.includes(s.id)) return s
          switch (mode) {
            case 'left': return { ...s, x: minX }
            case 'right': return { ...s, x: maxX - s.width }
            case 'hcenter': return { ...s, x: (minX + maxX) / 2 - s.width / 2 }
            case 'top': return { ...s, y: minY }
            case 'bottom': return { ...s, y: maxYReal - s.height }
            case 'vcenter': return { ...s, y: (minY + maxYReal) / 2 - s.height / 2 }
          }
        }),
      )
    },
    [selectedIds, applyChange],
  )

  const startDrag = useCallback((ids: string[], point: Point): boolean => {
    const origins: Record<string, Point> = {}
    for (const s of shapesRef.current) {
      if (ids.includes(s.id)) origins[s.id] = { x: s.x, y: s.y }
    }
    const count = Object.keys(origins).length
    if (count === 0) return false
    dragRef.current = { origins, start: point, snapshot: shapesRef.current, moved: false }
    return true
  }, [])

  const moveDrag = useCallback((point: Point) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = point.x - drag.start.x
    const dy = point.y - drag.start.y
    if (dx !== 0 || dy !== 0) dragRef.current = { ...drag, moved: true }
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
    const d: DraftShape =
      type === 'text'
        ? { type, x: point.x, y: point.y, width: 160, height: 0, fill: '#18181b', fontSize: 20 }
        : { type, x: point.x, y: point.y, width: 0, height: 0, fill: DEFAULT_FILL }
    draftRef.current = d
    setDraft(d)
  }, [])

  const moveDrawing = useCallback((point: Point, constrain = false) => {
    const d = draftRef.current
    if (!d) return
    const rect = normalizeRect(d, point)
    if (constrain) {
      const size = Math.max(rect.width, rect.height)
      rect.width = size
      rect.height = size
      rect.x = point.x < d.x ? d.x - size : d.x
      rect.y = point.y < d.y ? d.y - size : d.y
    }
    const next = { ...d, ...rect }
    draftRef.current = next
    setDraft(next)
  }, [])

  const commitDrawing = useCallback((): string | null => {
    const d = draftRef.current
    draftRef.current = null
    setDraft(null)
    if (!d) return null
    if (d.type === 'text') {
      const id = createId()
      const text = 'Текст'
      applyChange((prev) => [
        ...prev,
        { ...d, height: Math.max(d.height, Number(d.fontSize ?? 20) * 1.3), text, id },
      ])
      setSelectedIds([id])
      return id
    }
    if (d.width < 2 || d.height < 2) return null
    const id = createId()
    applyChange((prev) => [...prev, { ...d, id }])
    setSelectedIds([id])
    return id
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
    updateSelected,
    renameShape,
    select,
    deselect,
    moveSelected,
    deleteSelected,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    bringToFront,
    sendToBack,
    alignSelection,
    startDrag,
    moveDrag,
    endDrag,
    startResize,
    moveResize,
    endResize,
    startDrawing,
    moveDrawing,
    commitDrawing,
    cancelDrawing,
  }
}

export type ShapesApi = ReturnType<typeof useShapes>
export type { Rect }
