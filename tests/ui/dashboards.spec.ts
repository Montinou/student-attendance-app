import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'
import { TeacherDashboardPage } from '../page-objects/TeacherDashboard'
import { StudentDashboardPage } from '../page-objects/StudentDashboard'
import { TeacherReportsPage } from '../page-objects/TeacherReports'
import { StudentHistoryPage } from '../page-objects/StudentHistory'

test.describe('Dashboard Pages UI Tests', () => {
  test.describe('Teacher Dashboard', () => {
    test('should load teacher dashboard and display subjects', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const dashboardPage = new TeacherDashboardPage(page)

      // Login as teacher
      await loginPage.loginAsTeacher()

      // Verify dashboard loaded
      await dashboardPage.isLoaded()

      // Verify UI elements
      await expect(dashboardPage.heading).toHaveText(/Mis Materias/i)
      await dashboardPage.hasNewSubjectButton()

      // Subjects count should be visible (0 or more)
      const count = await dashboardPage.getSubjectsCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Student Dashboard', () => {
    test('should load student dashboard and display enrollments', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const dashboardPage = new StudentDashboardPage(page)

      // Login as student
      await loginPage.loginAsStudent()

      // Verify dashboard loaded
      await dashboardPage.isLoaded()

      // Verify UI elements
      await expect(dashboardPage.heading).toHaveText(/Mis Materias/i)
      await dashboardPage.hasScanQRButton()

      // Enrollments count should be visible (0 or more)
      const count = await dashboardPage.getEnrollmentsCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Teacher Reports Page', () => {
    test('should load reports page and display filter/table', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const reportsPage = new TeacherReportsPage(page)

      // Login as teacher
      await loginPage.loginAsTeacher()

      // Navigate to reports
      await reportsPage.goto()

      // Verify page loaded
      await reportsPage.isLoaded()

      // Verify UI elements
      await expect(reportsPage.heading).toHaveText(/Reportes de Asistencia/i)
      await expect(reportsPage.description).toBeVisible()
      await reportsPage.hasFilterSection()
      await reportsPage.hasReportsTable()
    })
  })

  test.describe('Student History Page', () => {
    test('should load history page and display attendance records', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const historyPage = new StudentHistoryPage(page)

      // Login as student
      await loginPage.loginAsStudent()

      // Navigate to history
      await historyPage.goto()

      // Verify page loaded
      await historyPage.isLoaded()

      // Verify UI elements
      await expect(historyPage.heading).toHaveText(/Historial de Asistencia/i)
      await expect(historyPage.description).toBeVisible()
      await historyPage.hasHistorySection()
    })
  })

  test.describe('Page Authorization', () => {
    test('teacher dashboard should redirect students', async ({ page }) => {
      const loginPage = new LoginPage(page)

      // Login as student
      await loginPage.loginAsStudent()

      // Try to access teacher dashboard
      await page.goto('/teacher')

      // Should redirect to student dashboard
      await page.waitForURL(/\/student/, { timeout: 5000 })
      expect(page.url()).toContain('/student')
    })

    test('student dashboard should redirect teachers', async ({ page }) => {
      const loginPage = new LoginPage(page)

      // Login as teacher
      await loginPage.loginAsTeacher()

      // Try to access student dashboard
      await page.goto('/student')

      // Should redirect to teacher dashboard
      await page.waitForURL(/\/teacher/, { timeout: 5000 })
      expect(page.url()).toContain('/teacher')
    })
  })
})
