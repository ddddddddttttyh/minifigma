export type Tool = 'select' | 'rectangle' | 'ellipse'

export type Corner = 'nw' | 'ne' | 'sw' | 'se'

export type ShapeType = 'rectangle' | 'ellipse'

export interface Point {
  x: number
  y: number
}

export interface Shape {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  fill?: string
}

export type DraftShape = Omit<Shape, 'id'>

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}
