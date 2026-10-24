import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import Home from './page'

afterEach(cleanup)

function coordinate(node: HTMLElement, axis: 'x' | 'y') {
  return Number.parseFloat(
    node.style.getPropertyValue(`--roadmap-node-${axis}`),
  )
}

describe('Home', () => {
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

    for (const node of [
      'HTML',
      'CSS',
      'SCSS',
      'JavaScript',
      'JavaScript Testing',
      'TypeScript',
      'React',
      'Next.js',
      'Auth',
      'React Testing',
      'Testing Fundamentals',
      'Next.js Testing',
      'Frontend Completion',
    ]) {
      expect(view.getByRole('heading', { level: 2, name: node })).toBeVisible()
    }

    expect(
      container.querySelectorAll('[data-connection-type="required"]'),
    ).toHaveLength(5)
    expect(
      container.querySelectorAll('[data-connection-type="optional"]'),
    ).toHaveLength(7)

    const react = view.getByRole('heading', { level: 2, name: 'React' })
    const testing = view.getByRole('heading', {
      level: 2,
      name: 'React Testing',
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
      .getByRole('heading', { level: 2, name: 'JavaScript Testing' })
      .closest('article')!
    const fundamentalsNode = view
      .getByRole('heading', { level: 2, name: 'Testing Fundamentals' })
      .closest('article')!

    expect(coordinate(javascriptTestingNode, 'x')).toBeLessThan(
      coordinate(javascriptNode, 'x'),
    )
    expect(coordinate(javascriptTestingNode, 'y')).toBe(
      coordinate(javascriptNode, 'y'),
    )
    expect(coordinate(fundamentalsNode, 'y')).toBeLessThan(
      coordinate(testingNode, 'y'),
    )
    expect(coordinate(fundamentalsNode, 'x')).toBe(coordinate(testingNode, 'x'))

    expect(container.querySelectorAll('[stroke-dasharray="7 7"]')).toHaveLength(
      7,
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
})
