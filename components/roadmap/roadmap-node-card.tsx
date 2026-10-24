'use client'

import type { CSSProperties } from 'react'

import { TopicContent } from '@/components/roadmap/topic-content'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NODE_HEIGHT, NODE_WIDTH } from '@/lib/roadmap/layout'
import type { PositionedNode } from '@/lib/roadmap/types'

export function RoadmapNodeCard({ node }: { node: PositionedNode }) {
  return (
    <Sheet>
      <article
        className="absolute rounded-lg border bg-card text-card-foreground shadow-xs select-none"
        style={
          {
            '--roadmap-node-x': `${node.x}px`,
            '--roadmap-node-y': `${node.y}px`,
            left: 'calc(var(--roadmap-node-x) * var(--roadmap-scale-x))',
            top: 'calc(var(--roadmap-node-y) * var(--roadmap-scale-y))',
            width: `calc(${NODE_WIDTH}px * var(--roadmap-scale-x))`,
            height: `calc(${NODE_HEIGHT}px * var(--roadmap-scale-y))`,
          } as CSSProperties
        }
      >
        <h2 className="size-full min-w-0 text-lg leading-tight font-medium wrap-anywhere">
          <SheetTrigger
            title={node.title}
            className="flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-3 py-1 text-center transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-4 sm:py-2"
          >
            <span className="line-clamp-2 min-w-0 max-w-full">
              {node.title}
            </span>
          </SheetTrigger>
        </h2>
      </article>
      <SheetContent
        side="right"
        className="overflow-y-auto motion-reduce:transition-none data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:lg:w-md"
      >
        <SheetHeader className="gap-3 px-6 pt-6 pr-14 wrap-anywhere">
          <SheetTitle>{node.title}</SheetTitle>
          <SheetDescription>{node.description}</SheetDescription>
        </SheetHeader>
        {node.content && <TopicContent content={node.content} />}
      </SheetContent>
    </Sheet>
  )
}
