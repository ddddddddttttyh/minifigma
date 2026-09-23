import type { Point } from '../types/shape'

export interface Viewport {
  scrollX: number
  scrollY: number
  zoom: number
}

export function translatePoint(
  origin: Point,
  delta: Point,
): Point {
  return {
    x: origin.x + delta.x,
    y: origin.y + delta.y,
  }
}

export function deltaBetween(
  from: Point,
  to: Point,
): Point {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
  }
}

export function normalizeRect(
  origin: { x: number; y: number },
  current: Point,
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(origin.x, current.x),
    y: Math.min(origin.y, current.y),
    width: Math.abs(current.x - origin.x),
    height: Math.abs(current.y - origin.y),
  }
}

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

export function screenToCanvas(
  screen: Point,
  viewport: Viewport,
  canvasRect: DOMRect,
): Point {
  return {
    x: (screen.x - canvasRect.left - viewport.scrollX) / viewport.zoom,
    y: (screen.y - canvasRect.top - viewport.scrollY) / viewport.zoom,
  }
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

export function zoomAtPoint(viewport: Viewport, nextZoom: number, screen: Point, canvasRect: DOMRect): Viewport {
  const zoom = clampZoom(nextZoom)
  const cx = screen.x - canvasRect.left
  const cy = screen.y - canvasRect.top
  const scale = zoom / viewport.zoom
  return {
    zoom,
    scrollX: cx - (cx - viewport.scrollX) * scale,
    scrollY: cy - (cy - viewport.scrollY) * scale,
  }
}
