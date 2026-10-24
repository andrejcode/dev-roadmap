import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TopicContent } from '@/components/roadmap/topic-content'
import { frontendRoadmap } from '@/lib/roadmap/frontend'
import Home from './page'

afterEach(cleanup)
afterEach(() => vi.restoreAllMocks())

function coordinate(node: HTMLElement, axis: 'x' | 'y') {
  return Number.parseFloat(
    node.style.getPropertyValue(`--roadmap-node-${axis}`),
  )
}

describe('Home', () => {
  it('renders structured learning material without an editable surface', async () => {
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: 'HTML' }))

    const dialog = within(await screen.findByRole('dialog', { name: 'HTML' }))
    expect(
      dialog.getByRole('heading', { name: 'Structure before styling' }),
    ).toBeVisible()
    expect(dialog.getByRole('table')).toBeVisible()
    expect(
      dialog.getByText('<h1>My first page</h1>', { exact: false }),
    ).toBeVisible()
    expect(
      dialog.getByRole('button', {
        name: 'MDN: Structuring content with HTML',
      }),
    ).toBeVisible()
    expect(dialog.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders the roadmap title and description as page content', () => {
    const { container } = render(<Home />)
    const view = within(container)

    expect(
      view.getByRole('heading', { level: 1, name: 'Frontend Development' }),
    ).toBeInTheDocument()
    expect(view.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      view.getByText(
        'Learn how to build modern web applications using HTML, CSS, JavaScript, and React.',
      ),
    ).toBeInTheDocument()
    expect(container.querySelector('header')).not.toBeInTheDocument()
    expect(view.getByRole('main')).not.toHaveClass('p-4', 'h-svh')
  })

  it('renders the roadmap nodes and connection types', () => {
    const { container } = render(<Home />)
    const view = within(container)

    for (const node of frontendRoadmap.nodes) {
      expect(
        view.getByRole('heading', { level: 2, name: node.title }),
      ).toBeVisible()
    }

    expect(
      container.querySelectorAll('[data-connection-type="required"]'),
    ).toHaveLength(9)
    expect(
      container.querySelectorAll('[data-connection-type="optional"]'),
    ).toHaveLength(8)

    const react = view.getByRole('heading', { level: 2, name: 'React' })
    const testing = view.getByRole('heading', {
      level: 2,
      name: 'State & Data',
    })
    const reactNode = react.closest('article')!
    const testingNode = testing.closest('article')!

    expect(coordinate(testingNode, 'x')).toBeLessThan(
      coordinate(reactNode, 'x'),
    )
    expect(coordinate(testingNode, 'y')).toBe(coordinate(reactNode, 'y'))

    const javascriptNode = view
      .getByRole('heading', { level: 2, name: 'JavaScript' })
      .closest('article')!
    const javascriptTestingNode = view
      .getByRole('heading', { level: 2, name: 'Git & Tooling' })
      .closest('article')!
    const fundamentalsNode = view
      .getByRole('heading', { level: 2, name: 'Unit Testing' })
      .closest('article')!

    expect(coordinate(javascriptTestingNode, 'x')).toBeLessThan(
      coordinate(javascriptNode, 'x'),
    )
    expect(coordinate(javascriptTestingNode, 'y')).toBe(
      coordinate(javascriptNode, 'y'),
    )
    expect(coordinate(fundamentalsNode, 'y')).toBeGreaterThan(
      coordinate(testingNode, 'y'),
    )
    expect(coordinate(fundamentalsNode, 'x')).toBe(coordinate(testingNode, 'x'))

    expect(container.querySelectorAll('[stroke-dasharray="7 7"]')).toHaveLength(
      8,
    )
  })

  it('opens node details and closes them with the close button or Escape', async () => {
    render(<Home />)

    const htmlTrigger = screen.getByRole('button', {
      name: 'HTML',
    })
    fireEvent.click(htmlTrigger)

    const dialog = await screen.findByRole('dialog', { name: 'HTML' })
    expect(dialog).toHaveAccessibleDescription(
      'Learn the basics of HTML, the standard markup language for creating web pages.',
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'React' }))
    const reactDialog = await screen.findByRole('dialog', { name: 'React' })
    expect(reactDialog).toHaveAccessibleDescription(
      'Learn the basics of React, a popular JavaScript library for building user interfaces.',
    )
    fireEvent.keyDown(reactDialog, { key: 'Escape', code: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('requires confirmation before opening an external resource', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: 'HTML' }))
    const sheet = await screen.findByRole('dialog', { name: 'HTML' })
    const resource = within(sheet).getByRole('button', {
      name: 'MDN: Structuring content with HTML',
    })
    fireEvent.click(resource)
    const confirmation = await screen.findByRole('alertdialog', {
      name: 'Open external resource?',
    })
    expect(
      within(confirmation).getByText(
        'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content',
      ),
    ).toBeVisible()
    expect(open).not.toHaveBeenCalled()
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'Cancel' }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    )
    expect(open).not.toHaveBeenCalled()
    expect(sheet).toBeVisible()

    fireEvent.click(resource)
    const nextConfirmation = await screen.findByRole('alertdialog')
    fireEvent.click(
      within(nextConfirmation).getByRole('button', { name: 'Continue' }),
    )
    expect(open).toHaveBeenCalledExactlyOnceWith(
      'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content',
      '_blank',
      'noopener,noreferrer',
    )
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    )
    expect(sheet).toBeVisible()
  })

  it('renders code as text and rejects unsafe documents without mounting markup', () => {
    const { container, rerender } = render(
      <TopicContent
        content={{
          type: 'doc',
          content: [
            {
              type: 'codeBlock',
              content: [
                {
                  type: 'text',
                  text: '<script>alert("not executable")</script>',
                },
              ],
            },
          ],
        }}
      />,
    )
    expect(container.querySelector('pre code')).toHaveTextContent(
      '<script>alert("not executable")</script>',
    )
    expect(container.querySelector('script')).not.toBeInTheDocument()
    expect(
      container.querySelector('[contenteditable="true"]'),
    ).not.toBeInTheDocument()
    rerender(
      <TopicContent
        content={{
          type: 'doc',
          content: [{ type: 'iframe', attrs: { src: 'https://example.com' } }],
        }}
      />,
    )
    expect(
      screen.getByText("This topic's learning material is unavailable."),
    ).toBeVisible()
    expect(container.querySelector('iframe')).not.toBeInTheDocument()
  })

  it('zooms the roadmap within limits and resets to the default level', () => {
    render(<Home />)

    const controls = within(
      screen.getByRole('group', { name: 'Roadmap zoom controls' }),
    )
    const zoomIn = controls.getByRole('button', { name: 'Zoom in' })
    const zoomOut = controls.getByRole('button', { name: 'Zoom out' })
    const reset = controls.getByRole('button', { name: 'Reset zoom' })
    const level = controls.getByLabelText('Zoom level')

    expect(level).toHaveTextContent('100%')
    expect(reset).toBeDisabled()
    fireEvent.click(zoomIn)
    expect(level).toHaveTextContent('125%')
    expect(reset).toBeEnabled()
    fireEvent.click(zoomOut)
    expect(level).toHaveTextContent('100%')

    for (let index = 0; index < 8; index += 1) {
      fireEvent.click(zoomOut)
    }
    expect(level).toHaveTextContent('50%')
    expect(zoomOut).toBeDisabled()
    expect(zoomIn).toBeEnabled()

    for (let index = 0; index < 10; index += 1) {
      fireEvent.click(zoomIn)
    }
    expect(level).toHaveTextContent('200%')
    expect(zoomIn).toBeDisabled()
    expect(zoomOut).toBeEnabled()

    fireEvent.click(reset)
    expect(level).toHaveTextContent('100%')
    expect(reset).toBeDisabled()
  })
})
