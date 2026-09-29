import { TOOLS } from '../constants/tools'
import type { Tool } from '../types/shape'

interface ToolbarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
}

const ICONS: Record<string, import('react').ReactElement> = {
  select: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2l10 6.5-4.3.8 2.4 4.3-1.8 1-2.4-4.4L3 13.2V2z" />
    </svg>
  ),
  rectangle: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1" />
    </svg>
  ),
  ellipse: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="8" cy="8" rx="5.5" ry="5.5" />
    </svg>
  ),
  text: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 3h10v2.2h-3.9V13H6.9V5.2H3V3z" />
    </svg>
  ),
}

export default function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div className="flex h-full w-12 flex-col items-center gap-1 border-r border-zinc-200 bg-white py-2">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          title={`${t.label} (${t.hotkey})`}
          onClick={() => onToolChange(t.id)}
          className={`flex h-8 w-8 items-center justify-center rounded ${
            activeTool === t.id ? 'bg-indigo-500 text-white' : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          {ICONS[t.id]}
        </button>
      ))}
    </div>
  )
}
