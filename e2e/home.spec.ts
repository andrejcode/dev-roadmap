import { expect, test } from '@playwright/test'

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
