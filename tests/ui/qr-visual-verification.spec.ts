import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://v0-student-attendance-app-fawn.vercel.app'

test.describe('QR Visual Verification', () => {
  test('should render QR code visually', async ({ page, request }) => {
    // Login
    const loginPage = new LoginPage(page)
    await loginPage.loginAsTeacher()

    // Get cookies
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    // Create test subject
    const subjectResponse = await request.post(`${BASE_URL}/api/subjects`, {
      headers: { Cookie: cookieHeader },
      data: {
        name: 'Visual QR Test ' + Date.now(),
        code: 'VIS' + Date.now(),
        schedule: 'Test',
        description: 'Visual verification test',
      },
    })

    const { subject } = await subjectResponse.json()

    // Create QR session
    const sessionResponse = await request.post(`${BASE_URL}/api/attendance-sessions`, {
      headers: { Cookie: cookieHeader },
      data: {
        subjectId: subject.id,
        expiresInMinutes: 5,
      },
    })

    const { session } = await sessionResponse.json()
    console.log('Session QR Code:', session.qr_code)

    // Navigate to QR page
    await page.goto(`${BASE_URL}/teacher/qr`)
    await page.waitForLoadState('networkidle')

    // Take screenshot before opening dialog
    await page.screenshot({ path: 'test-results/qr-page-before.png', fullPage: true })

    // Open QR dialog
    const viewButton = page.locator('button').filter({ has: page.locator('svg') }).first()
    await viewButton.click()

    // Wait for dialog
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Wait a moment for QR to render
    await page.waitForTimeout(2000)

    // Take screenshot of dialog
    await dialog.screenshot({ path: 'test-results/qr-dialog.png' })
    await page.screenshot({ path: 'test-results/qr-page-with-dialog.png', fullPage: true })

    // Check if canvas has content by evaluating its dimensions
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    const canvasData = await canvas.evaluate((el: HTMLCanvasElement) => {
      return {
        width: el.width,
        height: el.height,
        hasContext: !!el.getContext('2d'),
      }
    })

    console.log('Canvas data:', canvasData)
    expect(canvasData.width).toBeGreaterThan(0)
    expect(canvasData.height).toBeGreaterThan(0)

    // Check console for errors
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })

    console.log('Console errors:', consoleMessages)

    // Cleanup
    await request.patch(`${BASE_URL}/api/attendance-sessions/${session.id}`, {
      headers: { Cookie: cookieHeader },
      data: { action: 'end' },
    })

    await request.delete(`${BASE_URL}/api/subjects/${subject.id}`, {
      headers: { Cookie: cookieHeader },
    })
  })
})
