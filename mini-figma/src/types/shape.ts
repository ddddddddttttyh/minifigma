export type Tool = 'select' | 'rectangle' | 'ellipse' | 'text'

export type Corner = 'nw' | 'ne' | 'sw' | 'se'

export type ShapeType = 'rectangle' | 'ellipse' | 'text'

export interface Point {
  x: number
  y: number
}

export interface Shape {
  id: string
  type: ShapeType
  name?: string
  x: number
  y: number
  width: number
  height: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  radius?: number
  text?: string
  fontSize?: number
}

export type DraftShape = Omit<Shape, 'id'>

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}
