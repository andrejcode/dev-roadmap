import { expect, test } from '@playwright/test'

test('shows the product heading', async ({ page }) => {
  await page.goto('/')

  const header = page.getByRole('banner')

  await expect(header.getByText('DevRoadmap', { exact: true })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Log in' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Welcome to DevRoadmap' }),
  ).toBeVisible()
})
