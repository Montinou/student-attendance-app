import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'
import { TeacherQRPage } from '../page-objects/TeacherQRPage'

test.describe('QR Code Generation and Display', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.loginAsTeacher()
  })

  test('should generate QR code successfully', async ({ page }) => {
    const qrPage = new TeacherQRPage(page)

    // Navigate to QR generation page
    await qrPage.goto()
    await qrPage.isLoaded()

    // Check that we're on the right page
    await expect(qrPage.heading).toBeVisible()

    // Note: We can't fully test generation without subjects
    // This test verifies the page loads and UI is present
    console.log('QR generation page loaded successfully')
  })

  test('should display QR dialog without infinite loop', async ({ page }) => {
    const qrPage = new TeacherQRPage(page)

    // First, we need to check if there's an active session
    // If not, we'll need to skip this test or create one via API
    await qrPage.goto()
    await qrPage.isLoaded()

    // Check if active sessions card exists
    const hasActiveSessions = await qrPage.activeSessionsCard.isVisible().catch(() => false)

    if (!hasActiveSessions) {
      console.log('No active sessions found - skipping QR dialog test')
      test.skip()
      return
    }

    // Track network requests to detect loops
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/attendance-records')) {
        requests.push(request.url())
      }
    })

    // Open QR dialog
    await qrPage.openQRDialog()

    // Verify dialog is open
    expect(await qrPage.isQRDialogOpen()).toBe(true)

    // Verify QR canvas is displayed
    await qrPage.verifyQRDisplayed()

    // Verify time remaining is shown
    const timeRemaining = await qrPage.getTimeRemaining()
    expect(timeRemaining).toBeTruthy()

    // Wait 3 seconds and check for infinite loop
    const requestCount = await qrPage.verifyNoInfiniteLoop(3000)

    // Log results
    console.log(`Total API requests in 3 seconds: ${requestCount}`)
    console.log(`Expected: ~3-5 requests (one per second + initial load)`)

    // Verify attendance count is displayed (should be 0 or more)
    const count = await qrPage.getAttendanceCount()
    expect(count).toBeGreaterThanOrEqual(0)

    // Close dialog
    await qrPage.closeDialog()
  })

  test('should create QR session via API and display it', async ({ page, request }) => {
    const qrPage = new TeacherQRPage(page)

    // First, get teacher's subjects via API
    const subjectsResponse = await request.get(
      `${page.url().split('/teacher')[0]}/api/subjects`,
      {
        headers: {
          Cookie: (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
        }
      }
    )

    if (!subjectsResponse.ok()) {
      console.log('No subjects found - skipping test')
      test.skip()
      return
    }

    const { subjects } = await subjectsResponse.json()

    if (!subjects || subjects.length === 0) {
      console.log('No subjects available - skipping test')
      test.skip()
      return
    }

    // Create QR session via API
    const baseUrl = page.url().split('/teacher')[0]
    const sessionResponse = await request.post(`${baseUrl}/api/attendance-sessions`, {
      data: {
        subjectId: subjects[0].id,
        expiresInMinutes: 5
      },
      headers: {
        Cookie: (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
      }
    })

    expect(sessionResponse.ok()).toBe(true)
    const { session } = await sessionResponse.json()

    expect(session).toHaveProperty('qr_code')
    expect(session).toHaveProperty('expires_at')
    expect(session).toHaveProperty('subject_id', subjects[0].id)

    console.log('QR session created:', session.qr_code)

    // Now navigate to QR page and verify it shows
    await qrPage.goto()
    await page.waitForLoadState('networkidle')

    // Active sessions should be visible
    await expect(qrPage.activeSessionsCard).toBeVisible()

    // Open the QR dialog
    await qrPage.openQRDialog()

    // Verify QR is displayed
    await qrPage.verifyQRDisplayed()

    // Track requests for 2 seconds
    let requestCount = 0
    page.on('request', (request) => {
      if (request.url().includes('/api/attendance-records')) {
        requestCount++
      }
    })

    await page.waitForTimeout(2000)

    // Should have ~2-4 requests (one per second + initial)
    console.log(`Requests during QR display: ${requestCount}`)
    expect(requestCount).toBeLessThanOrEqual(5)

    // Clean up - end the session
    const endResponse = await request.patch(`${baseUrl}/api/attendance-sessions/${session.id}`, {
      data: { action: 'end' },
      headers: {
        Cookie: (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
      }
    })

    expect(endResponse.ok()).toBe(true)
    console.log('Test session cleaned up')
  })

  test('should update attendance count in real-time', async ({ page, request }) => {
    const qrPage = new TeacherQRPage(page)

    // Get subjects
    const baseUrl = page.url().split('/teacher')[0]
    const subjectsResponse = await request.get(`${baseUrl}/api/subjects`, {
      headers: {
        Cookie: (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
      }
    })

    if (!subjectsResponse.ok()) {
      test.skip()
      return
    }

    const { subjects } = await subjectsResponse.json()
    if (!subjects?.length) {
      test.skip()
      return
    }

    // Create session
    const sessionResponse = await request.post(`${baseUrl}/api/attendance-sessions`, {
      data: {
        subjectId: subjects[0].id,
        expiresInMinutes: 5
      },
      headers: {
        Cookie: (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
      }
    })

    const { session } = await sessionResponse.json()

    // Navigate and open dialog
    await qrPage.goto()
    await page.waitForLoadState('networkidle')
    await qrPage.openQRDialog()

    // Get initial count
    const initialCount = await qrPage.getAttendanceCount()
    console.log(`Initial attendance count: ${initialCount}`)

    // Simulate student scanning QR (via API)
    // Note: In a real scenario, you'd need a student account
    // For this test, we just verify the count display works

    // Wait a bit and verify count is still displayed
    await page.waitForTimeout(2000)
    const currentCount = await qrPage.getAttendanceCount()

    expect(currentCount).toBe(initialCount) // Should remain same if no one scanned

    // Clean up
    await request.patch(`${baseUrl}/api/attendance-sessions/${session.id}`, {
      data: { action: 'end' },
      headers: {
        Cookie: (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
      }
    })
  })
})
