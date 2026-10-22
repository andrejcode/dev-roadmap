import type {
  ConnectionType,
  Edge,
  Orientation,
  Position,
  RoadmapConnection,
  RoadmapDefinition,
  RoadmapNode,
} from './types'

export const NODE_WIDTH = 256
export const NODE_HEIGHT = 64
const COLUMN_GAP = 80
const ROW_GAP = 64
const CANVAS_PADDING = 40

const orientationOffsets: Record<Orientation, Position> = {
  up: { column: 0, row: -1 },
  right: { column: 1, row: 0 },
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
}

function getConnections(node: RoadmapNode) {
  const connections: Array<RoadmapConnection & { type: ConnectionType }> = []

  if (node.next?.required) {
    connections.push({ ...node.next.required, type: 'required' })
  }

  if (node.next?.optional) {
    const optionalConnections = Array.isArray(node.next.optional)
      ? node.next.optional
      : [node.next.optional]

    connections.push(
      ...optionalConnections.map((connection) => ({
        ...connection,
        type: 'optional' as const,
      })),
    )
  }

  return connections
}

export function layoutRoadmap(definition: RoadmapDefinition) {
  const nodesById = new Map(definition.nodes.map((node) => [node.id, node]))
  const positions = new Map<string, Position>([
    [definition.entryNodeId, { column: 0, row: 0 }],
  ])
  const queue = [definition.entryNodeId]

  while (queue.length > 0) {
    const nodeId = queue.shift()
    const node = nodeId ? nodesById.get(nodeId) : undefined
    const position = nodeId ? positions.get(nodeId) : undefined

    if (!node || !position) {
      continue
    }

    const connections = getConnections(node)
    const orientations = new Set(
      connections.map(({ orientation }) => orientation),
    )

    if (orientations.size !== connections.length || connections.length > 4) {
      throw new Error(`Node "${node.id}" has conflicting connections.`)
    }

    for (const connection of connections) {
      if (!nodesById.has(connection.id) || positions.has(connection.id)) {
        continue
      }

      const offset = orientationOffsets[connection.orientation]
      positions.set(connection.id, {
        column: position.column + offset.column,
        row: position.row + offset.row,
      })
      queue.push(connection.id)
    }
  }

  const placedPositions = [...positions.values()]
  const minimumColumn = Math.min(...placedPositions.map(({ column }) => column))
  const maximumColumn = Math.max(...placedPositions.map(({ column }) => column))
  const minimumRow = Math.min(...placedPositions.map(({ row }) => row))
  const maximumRow = Math.max(...placedPositions.map(({ row }) => row))

  const positionedNodes = definition.nodes.flatMap((node) => {
    const position = positions.get(node.id)
    if (!position) {
      return []
    }

    return [
      {
        ...node,
        position,
        x:
          CANVAS_PADDING +
          (position.column - minimumColumn) * (NODE_WIDTH + COLUMN_GAP),
        y:
          CANVAS_PADDING +
          (position.row - minimumRow) * (NODE_HEIGHT + ROW_GAP),
      },
    ]
  })
  const positionedNodesById = new Map(
    positionedNodes.map((node) => [node.id, node]),
  )
  const edges = positionedNodes.flatMap((source) =>
    getConnections(source).flatMap((connection) => {
      const target = positionedNodesById.get(connection.id)
      if (!target) {
        return []
      }

      return [
        {
          id: `${source.id}-${target.id}`,
          type: connection.type,
          orientation: connection.orientation,
          source,
          target,
        },
      ]
    }),
  )

  return {
    nodes: positionedNodes,
    edges,
    width:
      (maximumColumn - minimumColumn + 1) * NODE_WIDTH +
      (maximumColumn - minimumColumn) * COLUMN_GAP +
      CANVAS_PADDING * 2,
    height:
      (maximumRow - minimumRow + 1) * NODE_HEIGHT +
      (maximumRow - minimumRow) * ROW_GAP +
      CANVAS_PADDING * 2,
  }
}

export function getEdgePoints(edge: Edge) {
  const sourceCenterX = edge.source.x + NODE_WIDTH / 2
  const sourceCenterY = edge.source.y + NODE_HEIGHT / 2
  const targetCenterX = edge.target.x + NODE_WIDTH / 2
  const targetCenterY = edge.target.y + NODE_HEIGHT / 2

  switch (edge.orientation) {
    case 'up':
      return {
        x1: sourceCenterX,
        y1: edge.source.y,
        x2: targetCenterX,
        y2: edge.target.y + NODE_HEIGHT,
      }
    case 'right':
      return {
        x1: edge.source.x + NODE_WIDTH,
        y1: sourceCenterY,
        x2: edge.target.x,
        y2: targetCenterY,
      }
    case 'down':
      return {
        x1: sourceCenterX,
        y1: edge.source.y + NODE_HEIGHT,
        x2: targetCenterX,
        y2: edge.target.y,
      }
    case 'left':
      return {
        x1: edge.source.x,
        y1: sourceCenterY,
        x2: edge.target.x + NODE_WIDTH,
        y2: targetCenterY,
      }
  }
}
