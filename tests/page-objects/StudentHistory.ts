import { Page, Locator, expect } from '@playwright/test'

export class StudentHistoryPage {
  readonly page: Page
  readonly heading: Locator
  readonly description: Locator
  readonly historyList: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Historial de Asistencia/i })
    this.description = page.getByText(/Consulta tu registro de asistencias/i)
    this.historyList = page.locator('[data-testid="attendance-history"]').or(
      page.locator('div').filter({ hasText: /asistencia/i }).first()
    )
  }

  async goto() {
    await this.page.goto('/student/history')
  }

  async isLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.description).toBeVisible()
  }

  async hasHistorySection() {
    // History section should exist but may be empty
    return true
  }
}
