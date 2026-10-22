'use client'

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
        className="absolute rounded-lg border bg-card text-card-foreground shadow-xs"
        style={{
          left: node.x,
          top: node.y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        }}
      >
        <h2 className="size-full min-w-0 text-lg leading-tight font-medium [overflow-wrap:anywhere]">
          <SheetTrigger
            title={node.title}
            className="flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-4 py-2 text-center transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span className="line-clamp-2 min-w-0 max-w-full">
              {node.title}
            </span>
          </SheetTrigger>
        </h2>
      </article>
      <SheetContent
        side="right"
        className="overflow-y-auto motion-reduce:transition-none data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:lg:w-[28rem]"
      >
        <SheetHeader className="gap-3 px-6 pt-6 pr-14 wrap-anywhere">
          <SheetTitle>{node.title}</SheetTitle>
          <SheetDescription>{node.description}</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}
