import type { JSONContent } from '@tiptap/core'

export type Orientation = 'up' | 'right' | 'down' | 'left'
export type ConnectionType = 'required' | 'optional'

export type RoadmapConnection = {
  id: string
  orientation: Orientation
}

export type RoadmapNode = {
  id: string
  title: string
  description: string
  content?: JSONContent
  next?: {
    required?: RoadmapConnection
    optional?: RoadmapConnection | RoadmapConnection[]
  }
}

export type RoadmapDefinition = {
  id: string
  title: string
  description: string
  entryNodeId: string
  nodes: RoadmapNode[]
}

export type Position = {
  column: number
  row: number
}

export type PositionedNode = RoadmapNode & {
  position: Position
  x: number
  y: number
}

export type Edge = {
  id: string
  type: ConnectionType
  orientation: Orientation
  source: PositionedNode
  target: PositionedNode
}
