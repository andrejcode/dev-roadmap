import { describe, expect, it } from 'vitest'

import { frontendRoadmap } from './frontend'
import { getEdgePoints, layoutRoadmap } from './layout'
import type { Orientation, RoadmapDefinition, RoadmapNode } from './types'

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

describe('layoutRoadmap', () => {
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
    'keeps fixed spacing with a %s entry edge even when branches collide',
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
          node('branch-end'),
        ]),
      )

      expect(
        layout.nodes.find(({ id }) => id === 'core-end')!.position,
      ).toEqual(layout.nodes.find(({ id }) => id === 'branch-end')!.position)

      for (const edge of layout.edges) {
        const columnDistance = Math.abs(
          edge.target.position.column - edge.source.position.column,
        )
        const rowDistance = Math.abs(
          edge.target.position.row - edge.source.position.row,
        )
        expect(columnDistance + rowDistance).toBe(1)

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

  it('rejects missing targets and duplicate node IDs', () => {
    expect(() =>
      layoutRoadmap(
        roadmap([
          node('entry', { required: { id: 'missing', orientation: 'down' } }),
        ]),
      ),
    ).toThrow(/missing/i)
    expect(() =>
      layoutRoadmap(roadmap([node('entry'), node('entry')])),
    ).toThrow(/duplicate/i)
    expect(() => layoutRoadmap(roadmap([]))).toThrow(/entry/i)
  })

  it('accepts the frontend roadmap', () => {
    const layout = layoutRoadmap(frontendRoadmap)
    expect(layout.nodes).toHaveLength(frontendRoadmap.nodes.length)
    expect(layout.edges).toHaveLength(frontendRoadmap.nodes.length - 1)

    for (const edge of layout.edges) {
      const { x1, y1, x2, y2 } = getEdgePoints(edge)
      expect(x1 === x2 || y1 === y2).toBe(true)
    }
  })
})
