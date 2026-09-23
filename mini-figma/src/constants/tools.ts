import type { Tool } from '../types/shape'

export interface ToolInfo {
  id: Tool
  label: string
  hotkey: string | null
}

export const TOOLS: ToolInfo[] = [
  { id: 'select', label: 'Выбор', hotkey: 'V' },
  { id: 'rectangle', label: 'Прямоугольник', hotkey: 'R' },
  { id: 'ellipse', label: 'Эллипс', hotkey: 'O' },
]

export const TOOL_BY_KEY: Record<string, Tool> = Object.fromEntries(
  TOOLS.flatMap((t) => (t.hotkey ? [[t.hotkey.toLowerCase(), t.id] as const] : [])),
)
