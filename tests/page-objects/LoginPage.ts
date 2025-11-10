import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[name="email"]').or(page.locator('input[type="email"]'))
    this.passwordInput = page.locator('input[name="password"]').or(page.locator('input[type="password"]'))
    this.loginButton = page.getByRole('button', { name: /Iniciar Sesión|Login/i })
  }

  async goto(role: 'teacher' | 'student' = 'teacher') {
    await this.page.goto(`/auth/login?role=${role}`)
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
    // Wait for navigation
    await this.page.waitForURL(/\/(teacher|student)/)
  }

  async loginAsTeacher() {
    await this.goto('teacher')
    await this.login('agusmontoya@gmail.com', 'test1234')
  }

  async loginAsStudent() {
    await this.goto('student')
    await this.login('agusmontoya2@gmail.com', 'test1234')
  }
}
