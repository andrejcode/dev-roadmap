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

test('resizes roadmap cards with the viewport while keeping labels readable', async ({
  page,
}) => {
  await page.goto('/')

  for (const viewport of [
    { width: 1440, height: 900, nodeWidth: 256, nodeHeight: 64 },
    { width: 768, height: 1024, nodeWidth: 224, nodeHeight: 64 },
    { width: 390, height: 844, nodeWidth: 176, nodeHeight: 56 },
    { width: 320, height: 568, nodeWidth: 176, nodeHeight: 56 },
    { width: 1440, height: 900, nodeWidth: 256, nodeHeight: 64 },
  ]) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    const cards = await page.locator('main article').evaluateAll((articles) =>
      articles.map((article) => {
        const bounds = article.getBoundingClientRect()
        const trigger = article.querySelector('button')!
        const label = trigger.querySelector('span')!
        return {
          width: bounds.width,
          height: bounds.height,
          triggerHeight: trigger.getBoundingClientRect().height,
          labelFits:
            label.scrollWidth <= label.clientWidth &&
            label.scrollHeight <= label.clientHeight,
          fontSize: getComputedStyle(label).fontSize,
        }
      }),
    )

    expect(cards).toHaveLength(frontendRoadmap.nodes.length)
    for (const card of cards) {
      expect(card.width).toBe(viewport.nodeWidth)
      expect(card.height).toBe(viewport.nodeHeight)
      expect(card.triggerHeight).toBeGreaterThanOrEqual(44)
      expect(card.labelFits).toBe(true)
      expect(card.fontSize).toBe('18px')
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width)
  }
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`zooms around the current view and keeps details unscaled at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const controls = page.getByRole('group', { name: 'Roadmap zoom controls' })
    const zoomIn = controls.getByRole('button', {
      name: 'Zoom in',
      exact: true,
    })
    const zoomOut = controls.getByRole('button', {
      name: 'Zoom out',
      exact: true,
    })
    const reset = controls.getByRole('button', { name: 'Reset zoom' })
    const level = controls.getByLabel('Zoom level')
    const scroller = page.getByRole('region', { name: 'Roadmap canvas' })
    const card = page.locator('main article').first()
    const initialCard = (await card.boundingBox())!
    const initialControls = (await controls.boundingBox())!

    await scroller.evaluate((element) => {
      element.scrollLeft = (element.scrollWidth - element.clientWidth) * 0.45
      element.scrollTop = (element.scrollHeight - element.clientHeight) * 0.45
    })
    const center = async () =>
      scroller.evaluate((element) => {
        const viewportBounds = element.getBoundingClientRect()
        const canvasBounds = element
          .querySelector('.roadmap-canvas')!
          .getBoundingClientRect()
        return {
          x:
            (viewportBounds.left +
              element.clientWidth / 2 -
              canvasBounds.left) /
            canvasBounds.width,
          y:
            (viewportBounds.top + element.clientHeight / 2 - canvasBounds.top) /
            canvasBounds.height,
        }
      })
    const before = await center()

    await zoomIn.click()
    await expect(level).toHaveText('125%')
    const zoomedCard = (await card.boundingBox())!
    expect(zoomedCard.width).toBeCloseTo(initialCard.width * 1.25, 1)
    expect(zoomedCard.height).toBeCloseTo(initialCard.height * 1.25, 1)
    const after = await center()
    expect(after.x).toBeCloseTo(before.x, 2)
    expect(after.y).toBeCloseTo(before.y, 2)
    const zoomedControls = (await controls.boundingBox())!
    expect(zoomedControls.height).toBe(initialControls.height)
    expect(zoomedControls.width).toBe(initialControls.width)

    await page.getByRole('button', { name: 'HTML', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'HTML', exact: true })
    await expect(dialog).toBeVisible()
    await expect
      .poll(async () => {
        const bounds = await dialog.boundingBox()
        return bounds && Math.round(bounds.width)
      })
      .toBe(viewport.width >= 1024 ? 448 : viewport.width)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    await reset.click()
    await expect(level).toHaveText('100%')
    await expect(reset).toBeDisabled()
    await zoomOut.focus()
    await page.keyboard.press('Enter')
    await expect(level).toHaveText('75%')
    await zoomOut.click()
    await expect(level).toHaveText('50%')
    await expect(zoomOut).toBeDisabled()
    expect((await card.boundingBox())!.width).toBeCloseTo(
      initialCard.width / 2,
      1,
    )

    for (let step = 0; step < 6; step += 1) {
      await zoomIn.click()
    }
    await expect(level).toHaveText('200%')
    await expect(zoomIn).toBeDisabled()
    expect((await card.boundingBox())!.width).toBeCloseTo(
      initialCard.width * 2,
      1,
    )
    await expect(controls).toBeInViewport()
    await page.screenshot({ path: testInfo.outputPath('roadmap-zoomed.png') })
    await reset.click()
    await expect(level).toHaveText('100%')
    expect((await card.boundingBox())!.width).toBe(initialCard.width)
  })

  test(`keeps roadmap nodes and edges clear at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'HTML', exact: true }),
    ).toBeVisible()

    let zoom = 100
    for (const level of [100, 125, 200, 50, 100]) {
      while (zoom !== level) {
        await page
          .getByRole('button', {
            name: zoom < level ? 'Zoom in' : 'Zoom out',
            exact: true,
          })
          .click()
        zoom += zoom < level ? 25 : -25
      }

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
        return {
          nodes: bounds('article'),
          edges: bounds('.roadmap-canvas svg line'),
        }
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

      if (level === 125) {
        await page.screenshot({ path: testInfo.outputPath('roadmap-125.png') })
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
