import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { frontendRoadmap } from './frontend'
import { getEdgePoints, layoutRoadmap, NODE_HEIGHT, NODE_WIDTH } from './layout'
import type { Edge, Orientation, RoadmapDefinition, RoadmapNode } from './types'

function node(id: string, next?: RoadmapNode['next']): RoadmapNode {
  return { id, title: id, description: id, next }
}

function roadmap(nodes: RoadmapNode[]): RoadmapDefinition {
  return {
    id: 'test',
    title: 'Test',
    description: 'Test',
    entryNodeId: 'entry',
    nodes,
  }
}

function freeze<Value>(value: Value): Value {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

const generatedRoadmaps = fc
  .array(
    fc.record({
      slot: fc.nat(),
      required: fc.boolean(),
      optionalArray: fc.boolean(),
    }),
    { minLength: 1, maxLength: 60, size: 'large' },
  )
  .map((steps) => {
    const orientations: Orientation[] = ['up', 'right', 'down', 'left']
    const entry = node('entry')
    const nodes = [entry]
    const slots = orientations.map((orientation) => ({
      parent: entry,
      orientation,
    }))

    for (const [index, step] of steps.entries()) {
      const [{ parent, orientation }] = slots.splice(
        step.slot % slots.length,
        1,
      )
      const child = node(`node-${index}`)
      const next = (parent.next ??= {})
      const optional = next.optional
        ? Array.isArray(next.optional)
          ? next.optional
          : [next.optional]
        : []
      const connection = { id: child.id, orientation }

      if (!next.required && (step.required || optional.length === 3)) {
        next.required = connection
      } else {
        optional.push(connection)
        next.optional =
          optional.length === 1 && !step.optionalArray ? connection : optional
      }

      const incoming = orientations[(orientations.indexOf(orientation) + 2) % 4]
      for (const direction of orientations) {
        if (direction !== incoming) {
          slots.push({ parent: child, orientation: direction })
        }
      }
      nodes.push(child)
    }

    return roadmap(nodes)
  })

function expectClearLayout(layout: ReturnType<typeof layoutRoadmap>) {
  expect(Number.isFinite(layout.width)).toBe(true)
  expect(Number.isFinite(layout.height)).toBe(true)
  expect(layout.width).toBeGreaterThan(0)
  expect(layout.height).toBeGreaterThan(0)
  expect(new Set(layout.nodes.map(({ id }) => id)).size).toBe(
    layout.nodes.length,
  )
  expect(new Set(layout.edges.map(({ id }) => id)).size).toBe(
    layout.edges.length,
  )
  expect(layout.edges).toHaveLength(layout.nodes.length - 1)

  for (const [index, first] of layout.nodes.entries()) {
    expect(Number.isInteger(first.position.column)).toBe(true)
    expect(Number.isInteger(first.position.row)).toBe(true)
    expect(Number.isFinite(first.x)).toBe(true)
    expect(Number.isFinite(first.y)).toBe(true)
    expect(first.x).toBeGreaterThanOrEqual(0)
    expect(first.y).toBeGreaterThanOrEqual(0)
    expect(first.x + NODE_WIDTH).toBeLessThanOrEqual(layout.width)
    expect(first.y + NODE_HEIGHT).toBeLessThanOrEqual(layout.height)
    for (const second of layout.nodes.slice(index + 1)) {
      expect(
        first.x < second.x + NODE_WIDTH &&
          first.x + NODE_WIDTH > second.x &&
          first.y < second.y + NODE_HEIGHT &&
          first.y + NODE_HEIGHT > second.y,
        `Nodes "${first.id}" and "${second.id}" overlap`,
      ).toBe(false)
    }
  }

  const segments = layout.edges.map((edge) => {
    const { x1, x2, y1, y2 } = getEdgePoints(edge)
    expect(x1 === x2 || y1 === y2, `Edge "${edge.id}" is diagonal`).toBe(true)
    expect(Math.sign(x2 - x1)).toBe(
      edge.orientation === 'right' ? 1 : edge.orientation === 'left' ? -1 : 0,
    )
    expect(Math.sign(y2 - y1)).toBe(
      edge.orientation === 'down' ? 1 : edge.orientation === 'up' ? -1 : 0,
    )
    return {
      edge,
      left: Math.min(x1, x2),
      right: Math.max(x1, x2),
      top: Math.min(y1, y2),
      bottom: Math.max(y1, y2),
    }
  })

  for (const [index, segment] of segments.entries()) {
    for (const other of layout.nodes) {
      if (
        other.id === segment.edge.source.id ||
        other.id === segment.edge.target.id
      ) {
        continue
      }
      expect(
        segment.left <= other.x + NODE_WIDTH &&
          segment.right >= other.x &&
          segment.top <= other.y + NODE_HEIGHT &&
          segment.bottom >= other.y,
        `Edge "${segment.edge.id}" intersects node "${other.id}"`,
      ).toBe(false)
    }

    for (const other of segments.slice(index + 1)) {
      expect(
        segment.left <= other.right &&
          segment.right >= other.left &&
          segment.top <= other.bottom &&
          segment.bottom >= other.top,
        `Edges "${segment.edge.id}" and "${other.edge.id}" intersect`,
      ).toBe(false)
    }
  }
}

describe('layoutRoadmap', () => {
  it('lays out a single entry node with finite dimensions and padding', () => {
    const layout = layoutRoadmap(roadmap([node('entry')]))

    expectClearLayout(layout)
    expect(layout.nodes[0]).toMatchObject({
      id: 'entry',
      position: { column: 0, row: 0 },
      x: 40,
      y: 40,
    })
    expect(layout.width).toBe(NODE_WIDTH + 80)
    expect(layout.height).toBe(NODE_HEIGHT + 80)
    expect(layout.edges).toEqual([])
  })

  it.each([20261023, 42, 8675309])(
    'preserves geometry, metadata, and determinism for irregular trees (seed %s)',
    (seed) => {
      fc.assert(
        fc.property(generatedRoadmaps, (definition) => {
          const original = structuredClone(definition)
          freeze(definition)
          const layout = layoutRoadmap(definition)

          expectClearLayout(layout)
          expect(layout.nodes.map(({ id }) => id)).toEqual(
            definition.nodes.map(({ id }) => id),
          )
          for (const placed of layout.nodes) {
            expect(placed).toMatchObject(
              definition.nodes.find(({ id }) => id === placed.id)!,
            )
          }
          expect(layoutRoadmap(definition)).toEqual(layout)
          const reordered = layoutRoadmap({
            ...definition,
            nodes: definition.nodes.toReversed(),
          })
          expect(
            Object.fromEntries(
              reordered.nodes.map(({ id, position }) => [id, position]),
            ),
          ).toEqual(
            Object.fromEntries(
              layout.nodes.map(({ id, position }) => [id, position]),
            ),
          )
          expect(reordered.width).toBe(layout.width)
          expect(reordered.height).toBe(layout.height)
          expect(definition).toEqual(original)
        }),
        { seed, numRuns: 100 },
      )
    },
  )

  it('lays out a 1000-node path without recursive stack growth', () => {
    const nodes = Array.from({ length: 1000 }, (_, index) =>
      node(
        index === 0 ? 'entry' : `node-${index}`,
        index < 999
          ? { required: { id: `node-${index + 1}`, orientation: 'down' } }
          : undefined,
      ),
    )
    const layout = layoutRoadmap(roadmap(nodes))

    expect(layout.nodes).toHaveLength(1000)
    expect(layout.edges).toHaveLength(999)
    expect(layout.width).toBe(NODE_WIDTH + 80)
    expect(layout.height).toBe(1000 * NODE_HEIGHT + 999 * 64 + 80)
    for (const [index, placed] of layout.nodes.entries()) {
      expect(placed.position).toEqual({ column: 0, row: index })
    }
  })

  it('preserves required and optional edge types and endpoint references', () => {
    const definition = roadmap([
      node('entry', {
        required: { id: 'core', orientation: 'down' },
        optional: [
          { id: 'left', orientation: 'left' },
          { id: 'right', orientation: 'right' },
        ],
      }),
      node('core'),
      node('left'),
      node('right'),
    ])
    const layout = layoutRoadmap(definition)

    expect(
      layout.edges.map(({ type, orientation, target }) => ({
        type,
        orientation,
        targetId: target.id,
      })),
    ).toEqual([
      { type: 'required', orientation: 'down', targetId: 'core' },
      { type: 'optional', orientation: 'left', targetId: 'left' },
      { type: 'optional', orientation: 'right', targetId: 'right' },
    ])
    for (const edge of layout.edges) {
      expect(edge.source).toBe(
        layout.nodes.find(({ id }) => id === edge.source.id),
      )
      expect(edge.target).toBe(
        layout.nodes.find(({ id }) => id === edge.target.id),
      )
    }
  })

  it('gives distinct edges unique IDs even when node IDs contain separators', () => {
    const layout = layoutRoadmap(
      roadmap([
        node('entry', {
          required: { id: 'a-b', orientation: 'down' },
          optional: { id: 'a', orientation: 'right' },
        }),
        node('a-b', { required: { id: 'c', orientation: 'down' } }),
        node('a', { required: { id: 'b-c', orientation: 'right' } }),
        node('c'),
        node('b-c'),
      ]),
    )

    expectClearLayout(layout)
  })

  it.each([false, true])(
    'rejects two nodes pointing to the same target and names both sources (reversed: %s)',
    (reversed) => {
      const nodes = [
        node('entry', {
          required: { id: 'core', orientation: 'down' },
          optional: { id: 'branch', orientation: 'right' },
        }),
        node('branch', { required: { id: 'core', orientation: 'down' } }),
        node('core'),
      ]

      expect(() =>
        layoutRoadmap(roadmap(reversed ? nodes.toReversed() : nodes)),
      ).toThrow(
        'Node "core" has multiple incoming connections from "branch" and "entry". Only one incoming connection is allowed.',
      )
    },
  )

  it.each<[Orientation, Orientation]>([
    ['down', 'up'],
    ['up', 'down'],
    ['right', 'left'],
    ['left', 'right'],
  ])(
    'reserves the opposite side for an incoming %s edge',
    (incoming, outgoing) => {
      expect(() =>
        layoutRoadmap(
          roadmap([
            node('entry', {
              required: { id: 'middle', orientation: incoming },
            }),
            node('middle', { optional: { id: 'end', orientation: outgoing } }),
            node('end'),
          ]),
        ),
      ).toThrow(/middle.*side/i)
    },
  )

  it('rejects outgoing edges sharing a side', () => {
    expect(() =>
      layoutRoadmap(
        roadmap([
          node('entry', {
            required: { id: 'core', orientation: 'down' },
            optional: { id: 'branch', orientation: 'down' },
          }),
          node('core'),
          node('branch'),
        ]),
      ),
    ).toThrow(/entry.*side/i)
  })

  it('allows four edges at the entry and three outgoing edges elsewhere', () => {
    const definition = roadmap([
      node('entry', {
        required: { id: 'middle', orientation: 'down' },
        optional: [
          { id: 'top', orientation: 'up' },
          { id: 'left', orientation: 'left' },
          { id: 'right', orientation: 'right' },
        ],
      }),
      node('middle', {
        required: { id: 'end', orientation: 'down' },
        optional: [
          { id: 'middle-left', orientation: 'left' },
          { id: 'middle-right', orientation: 'right' },
        ],
      }),
      ...['top', 'left', 'right', 'end', 'middle-left', 'middle-right'].map(
        (id) => node(id),
      ),
    ])

    expect(layoutRoadmap(definition).edges).toHaveLength(7)
  })

  it('rejects four optional connections even with distinct sides', () => {
    expect(() =>
      layoutRoadmap(
        roadmap([
          node('entry', {
            optional: [
              { id: 'top', orientation: 'up' },
              { id: 'right', orientation: 'right' },
              { id: 'bottom', orientation: 'down' },
              { id: 'left', orientation: 'left' },
            ],
          }),
          ...['top', 'right', 'bottom', 'left'].map((id) => node(id)),
        ]),
      ),
    ).toThrow(/three optional/i)
  })

  it.each<Orientation>(['down', 'up', 'right', 'left'])(
    'extends an earlier branch connection to resolve a %s collision',
    (orientation) => {
      const perpendicular =
        orientation === 'down' || orientation === 'up' ? 'right' : 'down'
      const layout = layoutRoadmap(
        roadmap([
          node('entry', {
            required: { id: 'core', orientation },
            optional: { id: 'branch', orientation: perpendicular },
          }),
          node('core', {
            optional: { id: 'core-end', orientation: perpendicular },
          }),
          node('branch', {
            optional: { id: 'branch-end', orientation },
          }),
          node('core-end'),
          node('branch-end', {
            optional: { id: 'branch-leaf', orientation },
          }),
          node('branch-leaf'),
        ]),
      )

      expectClearLayout(layout)

      for (const edge of layout.edges) {
        const columnDistance = Math.abs(
          edge.target.position.column - edge.source.position.column,
        )
        const rowDistance = Math.abs(
          edge.target.position.row - edge.source.position.row,
        )
        expect(columnDistance + rowDistance).toBe(
          edge.target.id === 'branch' ? 2 : 1,
        )

        const points = getEdgePoints(edge)
        if (edge.orientation === 'down' || edge.orientation === 'up') {
          expect(points.x1).toBe(points.x2)
          expect(Math.sign(points.y2 - points.y1)).toBe(
            edge.orientation === 'down' ? 1 : -1,
          )
        } else {
          expect(points.y1).toBe(points.y2)
          expect(Math.sign(points.x2 - points.x1)).toBe(
            edge.orientation === 'right' ? 1 : -1,
          )
        }
      }
    },
  )

  it('rejects a connection to the entry node', () => {
    expect(() =>
      layoutRoadmap(
        roadmap([
          node('entry', { required: { id: 'child', orientation: 'down' } }),
          node('child', { required: { id: 'entry', orientation: 'right' } }),
        ]),
      ),
    ).toThrow(
      'Entry node "entry" has an invalid incoming connection from "child". The entry cannot have incoming connections.',
    )
  })

  it('keeps adjacent spacing when branches do not conflict', () => {
    const layout = layoutRoadmap(
      roadmap([
        node('entry', {
          required: { id: 'core', orientation: 'down' },
          optional: { id: 'branch', orientation: 'right' },
        }),
        node('core', { required: { id: 'end', orientation: 'down' } }),
        node('branch'),
        node('end'),
      ]),
    )

    expectClearLayout(layout)
    for (const edge of layout.edges) {
      expect(
        Math.abs(edge.target.position.column - edge.source.position.column) +
          Math.abs(edge.target.position.row - edge.source.position.row),
      ).toBe(1)
    }
  })

  it.each([0, 1, 2, 3])(
    'keeps dense, winding branches clear with direction order %s',
    (rotation) => {
      const orientations: Orientation[] = ['up', 'right', 'down', 'left']
      const nodes: RoadmapNode[] = []
      const queue: Array<{
        id: string
        depth: number
        incoming?: Orientation
      }> = [{ id: 'entry', depth: 0 }]

      for (let index = 0; index < queue.length; index += 1) {
        const current = queue[index]
        const connections =
          current.depth < 3
            ? orientations
                .slice(rotation)
                .concat(orientations.slice(0, rotation))
                .filter((orientation) => orientation !== current.incoming)
                .map((orientation) => {
                  const id = `${current.id}-${orientation}`
                  const oppositeIndex =
                    (orientations.indexOf(orientation) + 2) % 4
                  queue.push({
                    id,
                    depth: current.depth + 1,
                    incoming: orientations[oppositeIndex],
                  })
                  return { id, orientation }
                })
            : []
        nodes.push(
          node(current.id, {
            required: connections[0],
            optional: connections.slice(1),
          }),
        )
      }

      expectClearLayout(layoutRoadmap(roadmap(nodes)))
      expectClearLayout(layoutRoadmap(roadmap(nodes.toReversed())))
    },
  )

  it('rejects disconnected nodes, including disconnected cycles', () => {
    expect(() =>
      layoutRoadmap(
        roadmap([
          node('entry'),
          node('first', { required: { id: 'second', orientation: 'down' } }),
          node('second', { required: { id: 'first', orientation: 'right' } }),
        ]),
      ),
    ).toThrow(/reachable/i)
  })

  it.each([
    {
      name: 'a missing required target',
      nodes: [
        node('entry', { required: { id: 'missing', orientation: 'down' } }),
      ],
      error: /entry.*missing.*missing/i,
    },
    {
      name: 'a missing optional target',
      nodes: [
        node('entry', { optional: { id: 'missing', orientation: 'right' } }),
      ],
      error: /entry.*missing.*missing/i,
    },
    {
      name: 'duplicate entry IDs',
      nodes: [node('entry'), node('entry')],
      error: /duplicate/i,
    },
    {
      name: 'duplicate non-entry IDs',
      nodes: [node('entry'), node('child'), node('child')],
      error: /duplicate/i,
    },
    { name: 'an empty roadmap', nodes: [], error: /entry.*missing/i },
    {
      name: 'a missing entry',
      nodes: [node('other')],
      error: /entry.*missing/i,
    },
    {
      name: 'an unreachable node',
      nodes: [node('entry'), node('orphan')],
      error: /reachable/i,
    },
    {
      name: 'an entry self-loop',
      nodes: [
        node('entry', { required: { id: 'entry', orientation: 'down' } }),
      ],
      error: /entry.*incoming/i,
    },
    {
      name: 'a non-entry self-loop',
      nodes: [
        node('entry', { required: { id: 'child', orientation: 'down' } }),
        node('child', { required: { id: 'child', orientation: 'right' } }),
      ],
      error: /child.*incoming/i,
    },
    {
      name: 'a repeated target from one source',
      nodes: [
        node('entry', {
          required: { id: 'child', orientation: 'down' },
          optional: { id: 'child', orientation: 'right' },
        }),
        node('child'),
      ],
      error: /child.*incoming/i,
    },
    {
      name: 'two optional edges sharing a side',
      nodes: [
        node('entry', {
          optional: [
            { id: 'first', orientation: 'right' },
            { id: 'second', orientation: 'right' },
          ],
        }),
        node('first'),
        node('second'),
      ],
      error: /entry.*right.*side/i,
    },
  ])('rejects $name', ({ nodes, error }) => {
    expect(() => layoutRoadmap(roadmap(nodes))).toThrow(error)
  })

  it('accepts the frontend roadmap', () => {
    const layout = layoutRoadmap(frontendRoadmap)
    expect(layout.nodes).toHaveLength(frontendRoadmap.nodes.length)
    expect(layout.edges).toHaveLength(frontendRoadmap.nodes.length - 1)
    expect(
      new Set(
        layout.nodes.map(
          ({ position }) => `${position.column},${position.row}`,
        ),
      ).size,
    ).toBe(layout.nodes.length)

    for (const edge of layout.edges) {
      const { x1, y1, x2, y2 } = getEdgePoints(edge)
      expect(x1 === x2 || y1 === y2).toBe(true)
    }
  })

  it('extends JavaScript to React so Auth and testing branches have clear space', () => {
    const layout = layoutRoadmap(frontendRoadmap)
    const positions = new Map(
      layout.nodes.map(({ id, position }) => [id, position]),
    )

    expectClearLayout(layout)
    expect(positions.get('javascript')).toEqual({ column: 0, row: 2 })
    expect(positions.get('react')).toEqual({ column: 0, row: 4 })
    expect(positions.get('typescript')).toEqual({ column: 1, row: 2 })
    expect(positions.get('auth')).toEqual({ column: 1, row: 3 })
    expect(positions.get('javascript-testing')).toEqual({ column: -1, row: 2 })
    expect(positions.get('testing-fundamentals')).toEqual({
      column: -1,
      row: 3,
    })
  })
})

describe('getEdgePoints', () => {
  it.each([
    {
      orientation: 'up',
      target: { x: 100, y: 0 },
      expected: { x1: 228, y1: 200, x2: 228, y2: 64 },
    },
    {
      orientation: 'right',
      target: { x: 600, y: 200 },
      expected: { x1: 356, y1: 232, x2: 600, y2: 232 },
    },
    {
      orientation: 'down',
      target: { x: 100, y: 600 },
      expected: { x1: 228, y1: 264, x2: 228, y2: 600 },
    },
    {
      orientation: 'left',
      target: { x: -500, y: 200 },
      expected: { x1: 100, y1: 232, x2: -244, y2: 232 },
    },
  ] as const)(
    'attaches a stretched $orientation edge to the correct side centers',
    ({ orientation, target, expected }) => {
      const edge: Edge = {
        id: 'source-target',
        type: 'optional',
        orientation,
        source: {
          ...node('source'),
          position: { column: 0, row: 0 },
          x: 100,
          y: 200,
        },
        target: {
          ...node('target'),
          position: { column: 0, row: 0 },
          ...target,
        },
      }

      expect(getEdgePoints(edge)).toEqual(expected)
    },
  )
})
