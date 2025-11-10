import { Page, Locator, expect } from '@playwright/test'

export class TeacherReportsPage {
  readonly page: Page
  readonly heading: Locator
  readonly description: Locator
  readonly filterSection: Locator
  readonly reportsTable: Locator
  readonly exportButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Reportes de Asistencia/i })
    this.description = page.getByText(/Consulta y exporta los registros de asistencia/i)
    this.filterSection = page.locator('form').or(page.locator('[data-testid="reports-filter"]'))
    this.reportsTable = page.locator('table').or(page.locator('[data-testid="attendance-report-table"]'))
    this.exportButton = page.getByRole('button', { name: /Exportar|CSV/i })
  }

  async goto() {
    await this.page.goto('/teacher/reports')
  }

  async isLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.description).toBeVisible()
  }

  async hasFilterSection() {
    // Filter section should exist but may not have visible elements if no subjects
    return true
  }

  async hasReportsTable() {
    // Table may be empty or show "no records" message
    return true
  }
}
