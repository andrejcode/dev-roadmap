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

const oppositeSides: Record<Orientation, Orientation> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
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
  if (nodesById.size !== definition.nodes.length) {
    throw new Error('Roadmap has duplicate node IDs.')
  }
  if (!nodesById.has(definition.entryNodeId)) {
    throw new Error(`Entry node "${definition.entryNodeId}" is missing.`)
  }

  const connectionsById = new Map(
    definition.nodes.map((node) => [node.id, getConnections(node)]),
  )
  const incomingConnections = new Map<
    string,
    { sourceId: string; side: Orientation }
  >()

  for (const node of definition.nodes) {
    for (const connection of connectionsById.get(node.id)!) {
      if (!nodesById.has(connection.id)) {
        throw new Error(
          `Node "${node.id}" points to missing node "${connection.id}".`,
        )
      }
      if (connection.id === definition.entryNodeId) {
        throw new Error(
          `Entry node "${connection.id}" has an invalid incoming connection from "${node.id}". The entry cannot have incoming connections.`,
        )
      }
      const incoming = incomingConnections.get(connection.id)
      if (incoming) {
        const sources = [incoming.sourceId, node.id].sort()
        throw new Error(
          `Node "${connection.id}" has multiple incoming connections from "${sources[0]}" and "${sources[1]}". Only one incoming connection is allowed.`,
        )
      }
      incomingConnections.set(connection.id, {
        sourceId: node.id,
        side: oppositeSides[connection.orientation],
      })
    }
  }

  for (const node of definition.nodes) {
    const connections = getConnections(node)
    const incomingSide = incomingConnections.get(node.id)?.side
    const occupiedSides = new Set(incomingSide ? [incomingSide] : [])

    if (connections.filter(({ type }) => type === 'optional').length > 3) {
      throw new Error(
        `Node "${node.id}" has more than three optional connections.`,
      )
    }
    for (const connection of connections) {
      if (occupiedSides.has(connection.orientation)) {
        throw new Error(
          `Node "${node.id}" has multiple connections on its "${connection.orientation}" side.`,
        )
      }
      occupiedSides.add(connection.orientation)
    }
  }

  const traversal = [definition.entryNodeId]
  for (let index = 0; index < traversal.length; index += 1) {
    for (const connection of connectionsById.get(traversal[index])!) {
      traversal.push(connection.id)
    }
  }
  if (traversal.length !== definition.nodes.length) {
    throw new Error('All roadmap nodes must be reachable from the entry node.')
  }

  const positions = new Map<string, Position>([
    [definition.entryNodeId, { column: 0, row: 0 }],
  ])
  for (const nodeId of traversal) {
    const position = positions.get(nodeId)!
    for (const connection of connectionsById.get(nodeId)!) {
      const offset = orientationOffsets[connection.orientation]
      positions.set(connection.id, {
        column: position.column + offset.column,
        row: position.row + offset.row,
      })
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
