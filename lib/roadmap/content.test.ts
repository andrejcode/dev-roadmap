import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import {
  getSafeTopicUrl,
  TOPIC_CONTENT_LIMITS,
  validateTopicContent,
} from './content'
import { frontendRoadmap } from './frontend'

function paragraph(text = 'A useful lesson'): JSONContent {
  return { type: 'paragraph', content: [{ type: 'text', text }] }
}

function document(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content }
}

function table(rows: number, columns: number): JSONContent {
  return {
    type: 'table',
    content: Array.from({ length: rows }, () => ({
      type: 'tableRow',
      content: Array.from({ length: columns }, () => ({
        type: 'tableCell',
        content: [paragraph()],
      })),
    })),
  }
}

describe('frontend topic content', () => {
  it.each(frontendRoadmap.nodes)(
    'provides valid learning material for $title',
    (node) => {
      expect(() => validateTopicContent(node.content)).not.toThrow()
      const headings = node.content.content!.filter(
        (block) => block.type === 'heading',
      )
      expect(headings.map((block) => block.content?.[0].text)).toEqual([
        expect.any(String),
        'Learning goals',
        'Try it',
        'Read next',
      ])
      expect(node.content.content!.at(-1)!.content).toHaveLength(2)
    },
  )
})

describe('getSafeTopicUrl', () => {
  it('parses absolute HTTPS URLs without discarding queries or fragments', () => {
    const href = 'https://example.com/learn?topic=html#forms'
    expect(getSafeTopicUrl(href)?.href).toBe(href)
  })

  it.each([
    'http://example.com',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.com',
    '//example.com',
    '/relative',
    'https://name:password@example.com',
    'https://name@example.com',
    'https://example.com/with space',
    'https://exam\nple.com',
    ' https://example.com',
    'not a URL',
    '',
    null,
    { href: 'https://example.com' },
    `https://example.com/${'a'.repeat(2048)}`,
  ])('rejects unsafe or unsupported destination %j', (href) => {
    expect(getSafeTopicUrl(href)).toBeNull()
  })
})

describe('validateTopicContent', () => {
  it('accepts the text limit and rejects the next character', () => {
    expect(() =>
      validateTopicContent(
        document(paragraph('a'.repeat(TOPIC_CONTENT_LIMITS.characters))),
      ),
    ).not.toThrow()
    expect(() =>
      validateTopicContent(
        document(paragraph('a'.repeat(TOPIC_CONTENT_LIMITS.characters + 1))),
      ),
    ).toThrow(/text limit/)
  })

  it('counts code and table text toward the same text limit', () => {
    expect(() =>
      validateTopicContent(
        document(paragraph('a'.repeat(TOPIC_CONTENT_LIMITS.characters)), {
          type: 'codeBlock',
          content: [{ type: 'text', text: 'x' }],
        }),
      ),
    ).toThrow(/text limit/)
    expect(() =>
      validateTopicContent(
        document(
          paragraph('a'.repeat(TOPIC_CONTENT_LIMITS.characters)),
          table(1, 1),
        ),
      ),
    ).toThrow(/text limit/)
  })

  it('limits serialized bytes independently of text length', () => {
    expect(() =>
      validateTopicContent(
        document({
          type: 'codeBlock',
          attrs: { language: 'a'.repeat(TOPIC_CONTENT_LIMITS.bytes) },
          content: [{ type: 'text', text: 'short' }],
        }),
      ),
    ).toThrow(/document size limit/)
  })

  it('limits document nodes and nesting', () => {
    expect(() =>
      validateTopicContent(
        document(
          ...Array.from({ length: TOPIC_CONTENT_LIMITS.nodes }, () =>
            paragraph(),
          ),
        ),
      ),
    ).toThrow(/structure limits/)
    let nested = paragraph()
    for (let depth = 0; depth < TOPIC_CONTENT_LIMITS.depth; depth += 1) {
      nested = { type: 'blockquote', content: [nested] }
    }
    expect(() => validateTopicContent(document(nested))).toThrow(
      /structure limits/,
    )
  })

  it('limits table dimensions and disallows oversized merged cells', () => {
    const largestTable = document(
      table(TOPIC_CONTENT_LIMITS.tableRows, TOPIC_CONTENT_LIMITS.tableColumns),
    )
    expect(() => validateTopicContent(largestTable)).not.toThrow()
    expect(() =>
      validateTopicContent(
        document(table(TOPIC_CONTENT_LIMITS.tableRows + 1, 1)),
      ),
    ).toThrow(/too many rows/)
    expect(() =>
      validateTopicContent(
        document(table(1, TOPIC_CONTENT_LIMITS.tableColumns + 1)),
      ),
    ).toThrow(/too many columns/)
    const merged = table(1, 1)
    merged.content![0].content![0].attrs = { colspan: 1000 }
    expect(() => validateTopicContent(document(merged))).toThrow(
      /simple, automatically sized cells/,
    )
  })

  it.each([
    { type: 'html', attrs: { html: '<script>alert(1)</script>' } },
    { type: 'image', attrs: { src: 'https://example.com/tracker.png' } },
    { type: 'iframe', attrs: { src: 'https://example.com' } },
    { type: 'paragraph', attrs: { onclick: 'alert(1)' } },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Wrong heading level' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Unsafe mark', marks: [{ type: 'script' }] },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Unsafe attributes',
          marks: [{ type: 'bold', attrs: { onclick: 'alert(1)' } }],
        },
      ],
    },
  ])('rejects unsupported content %j', (block) => {
    expect(() => validateTopicContent(document(block))).toThrow()
  })

  it.each([
    'javascript:alert(1)',
    'http://example.com',
    '//example.com',
    'https://user:secret@example.com',
  ])('rejects document links to %s', (href) => {
    expect(() =>
      validateTopicContent(
        document({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Read more',
              marks: [{ type: 'link', attrs: { href } }],
            },
          ],
        }),
      ),
    ).toThrow(/HTTPS/)
  })

  it('rejects invalid document shape rather than relying on JSON types', () => {
    expect(() => validateTopicContent(paragraph())).toThrow(
      /must be a document/,
    )
    expect(() =>
      validateTopicContent(
        document({ type: 'text', text: 'Text outside a block' }),
      ),
    ).toThrow()
  })

  it('rejects inherited object names as undeclared attributes', () => {
    expect(() =>
      validateTopicContent(
        document({
          type: 'paragraph',
          attrs: { toString: 'unexpected' },
        }),
      ),
    ).toThrow(/attribute/)
    expect(() =>
      validateTopicContent(
        document({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'A lesson',
              marks: [{ type: 'bold', attrs: { constructor: 'unexpected' } }],
            },
          ],
        }),
      ),
    ).toThrow(/formatting/)
  })
})
