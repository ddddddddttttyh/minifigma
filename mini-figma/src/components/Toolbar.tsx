import { TOOLS } from '../constants/tools'
import type { Tool } from '../types/shape'

interface ToolbarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
}

export default function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div className="flex h-full w-12 flex-col items-center gap-1 border-r border-zinc-200 bg-white py-2">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          title={`${t.label} (${t.hotkey})`}
          onClick={() => onToolChange(t.id)}
          className={`flex h-8 w-8 items-center justify-center rounded text-lg ${
            activeTool === t.id ? 'bg-indigo-500 text-white' : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          {t.id === 'select' ? '↖' : t.id === 'rectangle' ? '▭' : '◯'}
        </button>
      ))}
    </div>
  )
}
