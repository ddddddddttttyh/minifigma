import { useEffect } from 'react'
import type { Tool } from '../types/shape'
import { TOOL_BY_KEY } from '../constants/tools'

interface ShapesApi {
  deleteSelected: () => void
  cancelDrawing: () => void
  deselect: () => void
  undo: () => void
  redo: () => void
  moveSelected: (dx: number, dy: number) => void
  copySelected: () => void
  pasteClipboard: () => void
}

export function useHotkeys(setTool: (tool: Tool) => void, shapes: ShapesApi) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (!['Escape'].includes(e.key)) return
        return
      }

      const tool = TOOL_BY_KEY[e.key.toLowerCase()]
      if (tool && !e.ctrlKey && !e.metaKey) {
        setTool(tool)
        return
      }

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) shapes.redo()
        else shapes.undo()
        return
      }

      if (ctrl && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        shapes.redo()
        return
      }

      if (ctrl && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        shapes.copySelected()
        return
      }

      if (ctrl && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        shapes.pasteClipboard()
        return
      }

      if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        shapes.copySelected()
        shapes.pasteClipboard()
        return
      }

      if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        shapes.moveSelected(dx, dy)
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        shapes.deleteSelected()
        return
      }

      if (e.key === 'Escape') {
        shapes.cancelDrawing()
        shapes.deselect()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setTool, shapes])
}
