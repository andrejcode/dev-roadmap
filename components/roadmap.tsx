import { RoadmapCanvas } from '@/components/roadmap/roadmap-canvas'
import type { RoadmapDefinition } from '@/lib/roadmap/types'

export function Roadmap({ roadmap }: { roadmap: RoadmapDefinition }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="flex shrink-0 flex-col gap-2 py-6">
        <h1
          id={`${roadmap.id}-title`}
          className="font-heading text-2xl font-semibold"
        >
          {roadmap.title}
        </h1>
        <p className="text-sm text-muted-foreground">{roadmap.description}</p>
      </div>

      <RoadmapCanvas roadmap={roadmap} />
    </div>
  )
}
