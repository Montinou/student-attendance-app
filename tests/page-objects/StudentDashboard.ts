import { Page, Locator, expect } from '@playwright/test'

export class StudentDashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly welcomeText: Locator
  readonly enrollmentsCount: Locator
  readonly scanQRButton: Locator
  readonly enrolledSubjectsList: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Mis Materias/i })
    this.welcomeText = page.getByText(/Bienvenido,/)
    this.enrollmentsCount = page.getByText(/materia.*inscrita/)
    this.scanQRButton = page.getByRole('button', { name: /Escanear QR/i }).or(
      page.locator('button').filter({ hasText: /QR/i })
    )
    this.enrolledSubjectsList = page.locator('[data-testid="enrolled-subjects"]').or(
      page.locator('div').filter({ hasText: /materia/ }).first()
    )
  }

  async goto() {
    await this.page.goto('/student')
  }

  async isLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.welcomeText).toBeVisible()
  }

  async getEnrollmentsCount(): Promise<number> {
    const text = await this.enrollmentsCount.textContent()
    const match = text?.match(/(\d+) materia/)
    return match ? parseInt(match[1]) : 0
  }

  async hasScanQRButton() {
    await expect(this.scanQRButton).toBeVisible()
    return true
  }
}
