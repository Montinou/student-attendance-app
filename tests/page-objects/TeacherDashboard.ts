import { Page, Locator, expect } from '@playwright/test'

export class TeacherDashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly welcomeText: Locator
  readonly subjectsCount: Locator
  readonly newSubjectButton: Locator
  readonly subjectsList: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Mis Materias/i })
    this.welcomeText = page.getByText(/Bienvenido,/)
    this.subjectsCount = page.getByText(/materia.*registrada/)
    this.newSubjectButton = page.getByRole('button', { name: /Nueva Materia/i })
    this.subjectsList = page.locator('[data-testid="subjects-list"]').or(page.locator('div').filter({ hasText: /materia/ }).first())
  }

  async goto() {
    await this.page.goto('/teacher')
  }

  async isLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.welcomeText).toBeVisible()
  }

  async getSubjectsCount(): Promise<number> {
    const text = await this.subjectsCount.textContent()
    const match = text?.match(/(\d+) materia/)
    return match ? parseInt(match[1]) : 0
  }

  async hasNewSubjectButton() {
    await expect(this.newSubjectButton).toBeVisible()
    return true
  }
}
