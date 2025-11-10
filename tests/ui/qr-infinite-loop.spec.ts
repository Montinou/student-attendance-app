import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://v0-student-attendance-app-fawn.vercel.app'

test.describe('QR Display - No Infinite Loop Test', () => {
  let subjectId: string
  let sessionId: string

  test('should display QR dialog without infinite loop', async ({ page, request }) => {
    // Step 1: Login to get authenticated context
    const loginPage = new LoginPage(page)
    await loginPage.loginAsTeacher()

    // Get cookies for API requests
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    // Step 2: Create a subject via API
    const subjectResponse = await request.post(`${BASE_URL}/api/subjects`, {
      headers: { Cookie: cookieHeader },
      data: {
        name: 'QR Loop Test Subject ' + Date.now(),
        code: 'LOOP' + Date.now(),
        schedule: 'Test Schedule',
        description: 'Testing QR display without infinite loops',
      },
    })

    expect(subjectResponse.status()).toBe(200)
    const { subject } = await subjectResponse.json()
    subjectId = subject.id

    console.log('✅ Created test subject:', subjectId)

    // Step 3: Generate QR code session via API
    const sessionResponse = await request.post(`${BASE_URL}/api/attendance-sessions`, {
      headers: { Cookie: cookieHeader },
      data: {
        subjectId: subjectId,
        expiresInMinutes: 5,
      },
    })

    expect(sessionResponse.status()).toBe(200)
    const sessionData = await sessionResponse.json()
    sessionId = sessionData.session.id

    console.log('✅ Generated QR session:', sessionId)

    // Step 4: Navigate to QR page (already logged in)
    await page.goto(`${BASE_URL}/teacher/qr`)
    await page.waitForLoadState('networkidle')

    console.log('✅ Navigated to QR page')

    // Step 5: Track API requests to detect loops
    const apiRequests: string[] = []
    let requestCount = 0

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/attendance-records')) {
        requestCount++
        apiRequests.push(`${requestCount}: ${url}`)
      }
    })

    // Step 6: Click the eye icon to open QR dialog
    // Find the active session card and click the view button
    const viewButton = page.locator('button').filter({ hasText: /^$/ }).filter({
      has: page.locator('svg')
    }).first()

    await viewButton.click()

    console.log('✅ Clicked view QR button')

    // Step 7: Verify dialog opened
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    console.log('✅ QR Dialog opened')

    // Step 8: Verify QR canvas is visible
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    console.log('✅ QR Canvas visible')

    // Step 9: Monitor for 4 seconds to detect infinite loop
    const startTime = Date.now()
    await page.waitForTimeout(4000)
    const endTime = Date.now()

    const duration = (endTime - startTime) / 1000
    console.log(`\n📊 Monitoring Results:`)
    console.log(`Duration: ${duration} seconds`)
    console.log(`Total API requests: ${requestCount}`)
    console.log(`Expected: ~4-6 requests (one per second + initial load)`)
    console.log(`Request rate: ${(requestCount / duration).toFixed(2)} req/sec`)

    if (apiRequests.length > 0) {
      console.log(`\nRequest log:`)
      apiRequests.forEach(req => console.log(`  ${req}`))
    }

    // Step 10: Assert no infinite loop
    // With 1 request per second, we expect roughly 4-6 requests in 4 seconds
    // If we have significantly more (e.g., > 10), there's likely a loop
    expect(requestCount).toBeLessThanOrEqual(10)
    expect(requestCount).toBeGreaterThanOrEqual(3) // At least some requests should happen

    if (requestCount > 10) {
      throw new Error(`❌ INFINITE LOOP DETECTED: ${requestCount} requests in ${duration}s`)
    }

    console.log('✅ No infinite loop detected!')

    // Step 11: Verify time remaining and attendance count are updating
    // Find time remaining in the dialog specifically
    const timeText = await dialog.locator('.text-blue-900').textContent()
    expect(timeText).toBeTruthy()
    console.log(`⏱️  Time remaining: ${timeText}`)

    const countElement = page.locator('.bg-green-50').locator('text=/^\\d+$/')
    const count = await countElement.textContent()
    expect(count).toBeTruthy()
    console.log(`👥 Attendance count: ${count}`)

    // Step 12: Close dialog
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 2000 })

    console.log('✅ Dialog closed successfully')

    // Cleanup: Delete test session
    const endSessionResponse = await request.patch(`${BASE_URL}/api/attendance-sessions/${sessionId}`, {
      headers: { Cookie: cookieHeader },
      data: { action: 'end' },
    })

    expect(endSessionResponse.status()).toBe(200)
    console.log('✅ Test session ended')

    // Cleanup: Delete test subject
    const deleteResponse = await request.delete(`${BASE_URL}/api/subjects/${subjectId}`, {
      headers: { Cookie: cookieHeader },
    })
    expect(deleteResponse.status()).toBe(200)
    console.log('✅ Test subject deleted')

    console.log('\n🎉 Test completed successfully - NO INFINITE LOOP!')
  })
})
