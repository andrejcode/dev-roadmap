'use client'

import { useState, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/core'
import { renderToReactElement } from '@tiptap/static-renderer/pm/react'
import { ExternalLink } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  getSafeTopicUrl,
  topicExtensions,
  validateTopicContent,
} from '@/lib/roadmap/content'

function TopicResource({
  href,
  children,
}: {
  href: unknown
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const url = getSafeTopicUrl(href)
  if (!url) {
    return <>{children}</>
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="link"
            className="h-auto max-w-full justify-start p-0 text-left whitespace-normal"
          />
        }
      >
        {children}
        <ExternalLink data-icon="inline-end" />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Open external resource?</AlertDialogTitle>
          <AlertDialogDescription>
            You are leaving DevRoadmap for {url.hostname}. This destination is
            provided by the topic author and is not verified by DevRoadmap.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="min-w-0 text-sm wrap-anywhere">{url.href}</p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              const destination = getSafeTopicUrl(href)
              if (destination) {
                window.open(destination.href, '_blank', 'noopener,noreferrer')
              }
              setOpen(false)
            }}
          >
            Continue
            <ExternalLink data-icon="inline-end" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function TopicContent({ content }: { content: JSONContent }) {
  let rendered: ReactNode
  try {
    validateTopicContent(content)
    rendered = renderToReactElement({
      extensions: topicExtensions,
      content,
      options: {
        markMapping: {
          link: ({ mark, children }) => (
            <TopicResource href={mark.attrs.href}>{children}</TopicResource>
          ),
        },
        nodeMapping: {
          table: ({ children }) => (
            <div className="max-w-full overflow-x-auto">
              <table>
                <tbody>{children}</tbody>
              </table>
            </div>
          ),
          tableHeader: ({ children }) => <th scope="col">{children}</th>,
        },
      },
    })
  } catch {
    return (
      <p className="px-6 pb-6 text-sm text-muted-foreground">
        This topic&apos;s learning material is unavailable.
      </p>
    )
  }
  return <div className="topic-content min-w-0 px-6 pb-8">{rendered}</div>
}
