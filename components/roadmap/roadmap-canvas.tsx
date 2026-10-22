import { RoadmapNodeCard } from '@/components/roadmap/roadmap-node-card'
import { getEdgePoints, layoutRoadmap } from '@/lib/roadmap/layout'
import type { RoadmapDefinition } from '@/lib/roadmap/types'

export function RoadmapCanvas({ roadmap }: { roadmap: RoadmapDefinition }) {
  const layout = layoutRoadmap(roadmap)

  return (
    <div className="flex min-h-0 flex-1 overflow-auto rounded-lg border border-border">
      <div
        className="relative m-auto shrink-0"
        style={{ width: layout.width, height: layout.height }}
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        >
          {layout.edges.map((edge) => (
            <line
              key={edge.id}
              {...getEdgePoints(edge)}
              data-connection-type={edge.type}
              className="stroke-muted-foreground"
              strokeDasharray={edge.type === 'optional' ? '7 7' : undefined}
              strokeLinecap="round"
              strokeWidth="2"
            />
          ))}
        </svg>

        {layout.nodes.map((node) => (
          <RoadmapNodeCard key={node.id} node={node} />
        ))}
      </div>
    </div>
  )
}
