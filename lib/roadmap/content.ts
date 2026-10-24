import { getSchema, type JSONContent } from '@tiptap/core'
import { TableKit } from '@tiptap/extension-table'
import StarterKit from '@tiptap/starter-kit'

export const TOPIC_CONTENT_LIMITS = {
  characters: 30_000,
  bytes: 200_000,
  nodes: 500,
  depth: 8,
  tableRows: 20,
  tableColumns: 6,
} as const

export const topicExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    horizontalRule: false,
    strike: false,
    underline: false,
    link: { openOnClick: false, autolink: false },
  }),
  TableKit,
]

const schema = getSchema(topicExtensions)

export function getSafeTopicUrl(value: unknown): URL | null {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    Array.from(value).some(
      (character) =>
        character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  ) {
    return null
  }
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
      ? url
      : null
  } catch {
    return null
  }
}

export function validateTopicContent(content: JSONContent): void {
  if (content?.type !== 'doc') {
    throw new Error('Topic content must be a document.')
  }
  if (
    new TextEncoder().encode(JSON.stringify(content)).length >
    TOPIC_CONTENT_LIMITS.bytes
  ) {
    throw new Error('Topic content exceeds the document size limit.')
  }

  let characters = 0
  let nodes = 0
  const pending = [{ node: content, depth: 0 }]
  while (pending.length > 0) {
    const { node, depth } = pending.pop()!
    nodes += 1
    if (
      depth > TOPIC_CONTENT_LIMITS.depth ||
      nodes > TOPIC_CONTENT_LIMITS.nodes
    ) {
      throw new Error('Topic content exceeds the structure limits.')
    }
    const nodeType = schema.nodes[node?.type ?? '']
    if (!nodeType) {
      throw new Error('Unsupported topic content block.')
    }
    if (
      Object.keys(node.attrs ?? {}).some(
        (attribute) => !Object.hasOwn(nodeType.spec.attrs ?? {}, attribute),
      )
    ) {
      throw new Error('Unsupported topic content attribute.')
    }
    if (node.type === 'heading' && ![2, 3].includes(node.attrs?.level)) {
      throw new Error('Only level two and three topic headings are allowed.')
    }
    if (
      node.type === 'table' &&
      (node.content?.length ?? 0) > TOPIC_CONTENT_LIMITS.tableRows
    ) {
      throw new Error('Topic table has too many rows.')
    }
    if (
      node.type === 'tableRow' &&
      (node.content?.length ?? 0) > TOPIC_CONTENT_LIMITS.tableColumns
    ) {
      throw new Error('Topic table has too many columns.')
    }
    if (node.type === 'tableCell' || node.type === 'tableHeader') {
      if (
        (node.attrs?.colspan ?? 1) !== 1 ||
        (node.attrs?.rowspan ?? 1) !== 1 ||
        (node.attrs?.colwidth ?? null) !== null
      ) {
        throw new Error(
          'Topic tables must use simple, automatically sized cells.',
        )
      }
    }
    for (const mark of node.marks ?? []) {
      const markType = schema.marks[mark.type]
      if (
        !markType ||
        Object.keys(mark.attrs ?? {}).some(
          (attribute) => !Object.hasOwn(markType.spec.attrs ?? {}, attribute),
        )
      ) {
        throw new Error('Unsupported topic content formatting.')
      }
      if (mark.type === 'link' && !getSafeTopicUrl(mark.attrs?.href)) {
        throw new Error(
          'Topic links must be absolute HTTPS URLs without credentials.',
        )
      }
    }
    characters += node.text?.length ?? 0
    if (characters > TOPIC_CONTENT_LIMITS.characters) {
      throw new Error('Topic content exceeds the text limit.')
    }
    for (const child of node.content ?? []) {
      pending.push({ node: child, depth: depth + 1 })
    }
  }
  schema.nodeFromJSON(content).check()
}
