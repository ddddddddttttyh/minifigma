import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampZoom,
  zoomAtPoint,
  type Viewport,
} from '../utils/geometry'

const ZOOM_FACTOR = 1.1

const INITIAL_VIEWPORT: Viewport = {
  scrollX: 0,
  scrollY: 0,
  zoom: 1,
}

const EXTENT = 5000

export function useViewport() {
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT)
  const [isPanning, setIsPanning] = useState(false)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const panStart = useRef<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    setViewport((v) => ({
      ...v,
      scrollX: el.clientWidth / 2 - EXTENT / 2,
      scrollY: el.clientHeight / 2 - EXTENT / 2,
    }))
  }, [])

  const getCanvasRect = useCallback((): DOMRect | null => {
    return canvasRef.current?.getBoundingClientRect() ?? null
  }, [])

  const startPan = useCallback((screenX: number, screenY: number) => {
    setViewport((v) => {
      panStart.current = { x: screenX, y: screenY, scrollX: v.scrollX, scrollY: v.scrollY }
      return v
    })
    setIsPanning(true)
  }, [])

  const movePan = useCallback((screenX: number, screenY: number) => {
    const start = panStart.current
    if (!start) return
    setViewport((v) => ({
      ...v,
      scrollX: start.scrollX + (screenX - start.x),
      scrollY: start.scrollY + (screenY - start.y),
    }))
  }, [])

  const endPan = useCallback(() => {
    panStart.current = null
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    e.preventDefault()
    setViewport((v) => {
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
      return zoomAtPoint(v, v.zoom * factor, { x: e.clientX, y: e.clientY }, rect)
    })
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setViewport((v) => ({ ...v, zoom: clampZoom(zoom) }))
  }, [])

  const setView = useCallback((v: Viewport) => {
    setViewport((prev) => ({ ...prev, zoom: clampZoom(v.zoom), scrollX: v.scrollX, scrollY: v.scrollY }))
  }, [])

  return {
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
  }
}
