import { useState } from 'react'
import Canvas from './components/Canvas'
import Toolbar from './components/Toolbar'
import PropertiesPanel from './components/PropertiesPanel'
import LayersPanel from './components/LayersPanel'
import { useShapes } from './hooks/useShapes'
import { useHotkeys } from './hooks/useHotkeys'
import type { Tool } from './types/shape'

export default function App() {
  const [tool, setTool] = useState<Tool>('select')
  const shapes = useShapes()
  useHotkeys(setTool, shapes)

  return (
    <div className="flex h-screen w-screen">
      <Toolbar activeTool={tool} onToolChange={setTool} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Canvas tool={tool} shapes={shapes} />
      </div>
      <div className="flex flex-col">
        <LayersPanel shapes={shapes.shapes} selectedIds={shapes.selectedIds} onSelect={shapes.select} />
        <PropertiesPanel shapes={shapes} />
      </div>
    </div>
  )
}
