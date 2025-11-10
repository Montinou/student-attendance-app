import { Page, Locator, expect } from '@playwright/test'

export class TeacherQRPage {
  readonly page: Page
  readonly heading: Locator
  readonly subjectSelect: Locator
  readonly expirationSelect: Locator
  readonly generateButton: Locator
  readonly activeSessionsCard: Locator
  readonly viewQRButton: Locator
  readonly qrDialog: Locator
  readonly qrCanvas: Locator
  readonly timeRemaining: Locator
  readonly attendanceCount: Locator
  readonly closeDialogButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Generar Código QR/i })
    this.subjectSelect = page.locator('select[name="subject"]').or(
      page.locator('button[role="combobox"]').filter({ hasText: /Selecciona/ })
    )
    this.expirationSelect = page.locator('select').filter({ hasText: /minutos/ }).or(
      page.locator('button[role="combobox"]').filter({ hasText: /minutos/ })
    )
    this.generateButton = page.getByRole('button', { name: /Generar QR|Crear/i })
    this.activeSessionsCard = page.locator('[data-testid="active-sessions"]').or(
      page.getByText(/Sesiones Activas/i).locator('..')
    )
    this.viewQRButton = page.getByRole('button').filter({ has: page.locator('svg') }).first()

    // QR Dialog elements
    this.qrDialog = page.locator('[role="dialog"]')
    this.qrCanvas = page.locator('canvas')
    this.timeRemaining = page.getByText(/:\d{2}/).or(page.getByText(/Expirado/))
    this.attendanceCount = page.locator('text=/\\d+/').filter({ has: page.getByText(/Asistencias/i) })
    this.closeDialogButton = page.locator('[role="dialog"] button[aria-label*="close"]').or(
      page.locator('[role="dialog"] button').first()
    )
  }

  async goto() {
    await this.page.goto('/teacher/qr')
  }

  async isLoaded() {
    await expect(this.heading).toBeVisible()
  }

  async generateQR(subjectIndex: number = 0, expirationMinutes: number = 30) {
    // If subject select is a combobox (shadcn), click and select
    const selectType = await this.subjectSelect.getAttribute('role')
    if (selectType === 'combobox') {
      await this.subjectSelect.click()
      // Click first option
      await this.page.getByRole('option').first().click()
    } else {
      // Regular select
      await this.subjectSelect.selectOption({ index: subjectIndex })
    }

    // Click generate button
    await this.generateButton.click()

    // Wait for success or active session to appear
    await this.page.waitForTimeout(1000)
  }

  async openQRDialog() {
    // Find and click the eye icon button (view QR)
    const eyeButton = this.page.locator('button').filter({
      has: this.page.locator('svg')
    }).first()

    await eyeButton.click()

    // Wait for dialog to be visible
    await expect(this.qrDialog).toBeVisible({ timeout: 5000 })
  }

  async isQRDialogOpen() {
    return await this.qrDialog.isVisible()
  }

  async verifyQRDisplayed() {
    // Verify canvas is visible
    await expect(this.qrCanvas).toBeVisible()

    // Verify canvas has content (width/height > 0)
    const canvas = await this.qrCanvas.elementHandle()
    const width = await canvas?.evaluate(el => (el as HTMLCanvasElement).width)
    const height = await canvas?.evaluate(el => (el as HTMLCanvasElement).height)

    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  }

  async verifyNoInfiniteLoop(durationMs: number = 3000) {
    // Track network requests count to detect excessive API calls
    let requestCount = 0

    this.page.on('request', (request) => {
      if (request.url().includes('/api/attendance-records')) {
        requestCount++
      }
    })

    // Wait for specified duration
    await this.page.waitForTimeout(durationMs)

    // With 1 request per second, we expect roughly durationMs/1000 requests
    // Add some buffer for initial load and timing variations
    const expectedMaxRequests = Math.ceil(durationMs / 1000) + 2

    // If we have way more requests, there's likely a loop
    expect(requestCount).toBeLessThanOrEqual(expectedMaxRequests)

    return requestCount
  }

  async getTimeRemaining() {
    const text = await this.timeRemaining.textContent()
    return text?.trim() || ''
  }

  async getAttendanceCount() {
    // Find the number in the attendance count section
    const countText = await this.page
      .locator('.bg-green-50')
      .getByText(/^\d+$/)
      .textContent()

    return parseInt(countText || '0')
  }

  async closeDialog() {
    // Click outside or use ESC
    await this.page.keyboard.press('Escape')
    await expect(this.qrDialog).not.toBeVisible({ timeout: 2000 })
  }
}
