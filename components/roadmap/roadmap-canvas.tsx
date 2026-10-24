'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

import { RoadmapNodeCard } from '@/components/roadmap/roadmap-node-card'
import { Button } from '@/components/ui/button'
import { getEdgePoints, layoutRoadmap } from '@/lib/roadmap/layout'
import type { RoadmapDefinition } from '@/lib/roadmap/types'

const MIN_ZOOM = 50
const MAX_ZOOM = 200
const ZOOM_STEP = 25

function viewportCenter(viewport: HTMLDivElement) {
  const bounds = viewport.getBoundingClientRect()
  return {
    x: bounds.left + viewport.clientLeft + viewport.clientWidth / 2,
    y: bounds.top + viewport.clientTop + viewport.clientHeight / 2,
  }
}

export function RoadmapCanvas({ roadmap }: { roadmap: RoadmapDefinition }) {
  const [zoom, setZoom] = useState(100)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<{ x: number; y: number } | null>(null)
  const layout = layoutRoadmap(roadmap)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const canvas = canvasRef.current
    const anchor = anchorRef.current
    if (!viewport || !canvas || !anchor) {
      return
    }

    const bounds = canvas.getBoundingClientRect()
    const center = viewportCenter(viewport)
    viewport.scrollLeft += bounds.left + anchor.x * (zoom / 100) - center.x
    viewport.scrollTop += bounds.top + anchor.y * (zoom / 100) - center.y
    anchorRef.current = null
  }, [zoom])

  function changeZoom(value: number) {
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
    if (nextZoom === zoom) {
      return
    }

    const viewport = viewportRef.current
    const canvas = canvasRef.current
    if (viewport && canvas) {
      const bounds = canvas.getBoundingClientRect()
      const center = viewportCenter(viewport)
      anchorRef.current = {
        x: (center.x - bounds.left) / (zoom / 100),
        y: (center.y - bounds.top) / (zoom / 100),
      }
    }
    setZoom(nextZoom)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <div
        role="group"
        aria-label="Roadmap zoom controls"
        className="flex shrink-0 items-center justify-end gap-1 border-b px-2 py-1"
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={zoom === MIN_ZOOM}
          onClick={() => changeZoom(zoom - ZOOM_STEP)}
        >
          <ZoomOut />
        </Button>
        <output
          aria-label="Zoom level"
          aria-live="polite"
          className="w-14 shrink-0 text-center text-sm tabular-nums select-none"
        >
          {zoom}%
        </output>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={zoom === MAX_ZOOM}
          onClick={() => changeZoom(zoom + ZOOM_STEP)}
        >
          <ZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Reset zoom"
          title="Reset zoom"
          disabled={zoom === 100}
          onClick={() => changeZoom(100)}
        >
          <RotateCcw />
        </Button>
      </div>

      <div
        ref={viewportRef}
        role="region"
        aria-label="Roadmap canvas"
        className="flex min-h-0 flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div
          ref={canvasRef}
          className="roadmap-canvas relative m-auto shrink-0"
          style={{
            width: `calc(${layout.width}px * var(--roadmap-scale-x))`,
            height: `calc(${layout.height}px * var(--roadmap-scale-y))`,
            zoom: zoom / 100,
          }}
        >
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            preserveAspectRatio="none"
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
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {layout.nodes.map((node) => (
            <RoadmapNodeCard key={node.id} node={node} />
          ))}
        </div>
      </div>
    </div>
  )
}
