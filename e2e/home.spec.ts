import { expect, test } from '@playwright/test'

import { frontendRoadmap } from '../lib/roadmap/frontend'

test('shows the product heading', async ({ page }) => {
  await page.goto('/')

  const header = page.getByRole('banner')

  await expect(header.getByText('DevRoadmap', { exact: true })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Log in' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Frontend Development' }),
  ).toBeVisible()
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`keeps roadmap nodes and edges clear at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'HTML', exact: true }),
    ).toBeVisible()

    const { nodes, edges } = await page.getByRole('main').evaluate((main) => {
      const bounds = (selector: string) =>
        Array.from(main.querySelectorAll(selector), (element) => {
          const rectangle = element.getBoundingClientRect()
          return {
            left: rectangle.left,
            right: rectangle.right,
            top: rectangle.top,
            bottom: rectangle.bottom,
          }
        })
      return { nodes: bounds('article'), edges: bounds('svg line') }
    })

    expect(nodes).toHaveLength(frontendRoadmap.nodes.length)
    expect(edges).toHaveLength(nodes.length - 1)
    for (const [index, first] of nodes.entries()) {
      for (const second of nodes.slice(index + 1)) {
        expect(
          first.left < second.right &&
            first.right > second.left &&
            first.top < second.bottom &&
            first.bottom > second.top,
          `Nodes ${index} and ${nodes.indexOf(second)} overlap`,
        ).toBe(false)
      }
    }

    for (const [index, edge] of edges.entries()) {
      expect(edge.left === edge.right || edge.top === edge.bottom).toBe(true)
      const horizontal = edge.top === edge.bottom
      expect(
        nodes.filter((other) =>
          horizontal
            ? edge.left === other.right &&
              edge.top === (other.top + other.bottom) / 2
            : edge.top === other.bottom &&
              edge.left === (other.left + other.right) / 2,
        ),
        `Edge ${index} does not start at a card side center`,
      ).toHaveLength(1)
      expect(
        nodes.filter((other) =>
          horizontal
            ? edge.right === other.left &&
              edge.top === (other.top + other.bottom) / 2
            : edge.bottom === other.top &&
              edge.left === (other.left + other.right) / 2,
        ),
        `Edge ${index} does not end at a card side center`,
      ).toHaveLength(1)
      for (const other of nodes) {
        expect(
          edge.left < other.right &&
            edge.right > other.left &&
            edge.top < other.bottom &&
            edge.bottom > other.top,
          `Edge ${index} passes through node ${nodes.indexOf(other)}`,
        ).toBe(false)
      }
      for (const other of edges.slice(index + 1)) {
        expect(
          edge.left <= other.right &&
            edge.right >= other.left &&
            edge.top <= other.bottom &&
            edge.bottom >= other.top,
          `Edges ${index} and ${edges.indexOf(other)} intersect`,
        ).toBe(false)
      }
    }

    await page.screenshot({ path: testInfo.outputPath('roadmap.png') })
  })

  test(`opens details for every roadmap node at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')

    for (const node of frontendRoadmap.nodes) {
      const trigger = page.getByRole('button', {
        name: node.title,
        exact: true,
      })
      await trigger.click()
      const dialog = page.getByRole('dialog', { name: node.title, exact: true })
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveAccessibleDescription(node.description)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(trigger).toBeFocused()
    }
  })

  test(`shows and dismisses node details at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const trigger = page.getByRole('button', { name: 'HTML', exact: true })
    const dialog = page.getByRole('dialog', { name: 'HTML', exact: true })

    await trigger.click()
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAccessibleDescription(
      'Learn the basics of HTML, the standard markup language for creating web pages.',
    )
    await expect(dialog.getByRole('heading', { name: 'HTML' })).toBeVisible()

    await expect
      .poll(async () => {
        const bounds = await dialog.boundingBox()
        return (
          bounds && {
            x: Math.round(bounds.x),
            y: Math.round(bounds.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
          }
        )
      })
      .toEqual({
        x: viewport.width >= 1024 ? viewport.width - 448 : 0,
        y: 0,
        width: viewport.width >= 1024 ? 448 : viewport.width,
        height: viewport.height,
      })

    const overlay = page.locator('[data-slot="sheet-overlay"]')
    await expect(overlay).toBeVisible()
    await expect(overlay).toHaveCSS('position', 'fixed')
    await page.screenshot({ path: testInfo.outputPath('node-details.png') })

    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()

    await trigger.press('Enter')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()

    if (viewport.width >= 1024) {
      await trigger.click()
      await expect(dialog).toBeVisible()
      await overlay.click({ position: { x: 16, y: 200 } })
      await expect(dialog).toBeHidden()
      await expect(trigger).toBeFocused()
    }
  })
}
