import { useEffect } from 'react'
import type { Tool } from '../types/shape'
import { TOOL_BY_KEY } from '../constants/tools'

interface ShapesApi {
  deleteSelected: () => void
  cancelDrawing: () => void
  deselect: () => void
  undo: () => void
  redo: () => void
}

export function useHotkeys(setTool: (tool: Tool) => void, shapes: ShapesApi) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      const tool = TOOL_BY_KEY[e.key.toLowerCase()]
      if (tool && !e.ctrlKey && !e.metaKey) {
        setTool(tool)
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) shapes.redo()
        else shapes.undo()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        shapes.redo()
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
