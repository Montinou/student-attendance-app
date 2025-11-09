import { test, expect } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://v0-student-attendance-app-fawn.vercel.app'

// Helper function to authenticate
async function authenticateUser(request: any, email: string, password: string) {
  const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password },
  })

  expect(loginResponse.ok()).toBeTruthy()
  const { user } = await loginResponse.json()
  return { userId: user.id }
}

test.describe('Complete Attendance Flow', () => {
  let teacherUserId: string
  let studentUserId: string
  let subjectId: string
  let sessionId: string
  let qrCode: string

  test.beforeAll(async ({ request }) => {
    // Authenticate teacher
    const teacherAuth = await authenticateUser(request, 'agusmontoya@gmail.com', 'test1234')
    teacherUserId = teacherAuth.userId

    // Authenticate student
    const studentAuth = await authenticateUser(request, 'agusmontoya2@gmail.com', 'test1234')
    studentUserId = studentAuth.userId
  })

  test.describe.serial('End-to-end attendance flow', () => {
    test('Step 1: Teacher creates a subject', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya@gmail.com', 'test1234')

      const response = await request.post(`${BASE_URL}/api/subjects`, {
        data: {
          name: 'E2E Test Subject ' + Date.now(),
          code: 'E2E' + Date.now(),
          schedule: 'Monday 10:00-12:00',
          description: 'Subject for end-to-end testing',
        },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      subjectId = data.subject.id

      console.log('Created subject:', subjectId)
    })

    test('Step 2: Student enrolls in the subject', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya2@gmail.com', 'test1234')

      const response = await request.post(`${BASE_URL}/api/enrollments`, {
        data: {
          studentId: studentUserId,
          subjectId: subjectId,
        },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('enrollment')
      expect(data.enrollment.subject_id).toBe(subjectId)
      expect(data.enrollment.student_id).toBe(studentUserId)

      console.log('Student enrolled in subject')
    })

    test('Step 3: Verify enrollment', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya2@gmail.com', 'test1234')

      const response = await request.get(
        `${BASE_URL}/api/enrollments/check?studentId=${studentUserId}&subjectId=${subjectId}`
      )

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.isEnrolled).toBe(true)
      expect(data).toHaveProperty('enrollment')

      console.log('Enrollment verified')
    })

    test('Step 4: Teacher generates QR code for attendance', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya@gmail.com', 'test1234')

      const response = await request.post(`${BASE_URL}/api/attendance-sessions`, {
        data: {
          subjectId: subjectId,
          expiresInMinutes: 30,
        },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('session')
      expect(data.session).toHaveProperty('qr_code')
      expect(data.session).toHaveProperty('expires_at')

      sessionId = data.session.id
      qrCode = data.session.qr_code

      console.log('QR code generated:', qrCode)
    })

    test('Step 5: Validate QR code before scanning', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya2@gmail.com', 'test1234')

      const response = await request.post(`${BASE_URL}/api/attendance-sessions/validate`, {
        data: {
          qrCode: qrCode,
          studentId: studentUserId,
        },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(true)
      expect(data).toHaveProperty('session')
      expect(data.session.id).toBe(sessionId)

      console.log('QR code is valid')
    })

    test('Step 6: Student scans QR and records attendance', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya2@gmail.com', 'test1234')

      const response = await request.post(`${BASE_URL}/api/attendance-records`, {
        data: {
          qrCode: qrCode,
          studentId: studentUserId,
        },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('successfully')
      expect(data).toHaveProperty('record')
      expect(data.record.session_id).toBe(sessionId)
      expect(data.record.student_id).toBe(studentUserId)

      console.log('Attendance recorded successfully')
    })

    test('Step 7: Verify duplicate attendance is prevented', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya2@gmail.com', 'test1234')

      const response = await request.post(`${BASE_URL}/api/attendance-records`, {
        data: {
          qrCode: qrCode,
          studentId: studentUserId,
        },
      })

      expect(response.status()).toBe(409) // Conflict

      const data = await response.json()
      expect(data.error).toContain('already recorded')

      console.log('Duplicate attendance correctly prevented')
    })

    test('Step 8: Teacher views attendance records', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya@gmail.com', 'test1234')

      const response = await request.get(
        `${BASE_URL}/api/attendance-records?teacherId=${teacherUserId}&subjectId=${subjectId}`
      )

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('records')
      expect(Array.isArray(data.records)).toBeTruthy()
      expect(data.records.length).toBeGreaterThan(0)

      // Verify our record is in the list
      const ourRecord = data.records.find((r: any) => r.session_id === sessionId)
      expect(ourRecord).toBeDefined()
      expect(ourRecord.student_id).toBe(studentUserId)

      console.log('Teacher can view attendance records')
    })

    test('Step 9: Student views their attendance history', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya2@gmail.com', 'test1234')

      const response = await request.get(
        `${BASE_URL}/api/attendance-records?studentId=${studentUserId}`
      )

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('records')
      expect(Array.isArray(data.records)).toBeTruthy()
      expect(data.records.length).toBeGreaterThan(0)

      // Verify our record is in the list
      const ourRecord = data.records.find((r: any) => r.session_id === sessionId)
      expect(ourRecord).toBeDefined()

      console.log('Student can view their attendance history')
    })

    test('Step 10: Teacher ends the session early', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya@gmail.com', 'test1234')

      const response = await request.patch(`${BASE_URL}/api/attendance-sessions/${sessionId}`, {
        data: {
          action: 'end',
        },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      console.log('Session ended successfully')
    })

    test('Step 11: Verify QR code is invalid after session ends', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya2@gmail.com', 'test1234')

      // Wait a moment for the session to update
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const response = await request.post(`${BASE_URL}/api/attendance-sessions/validate`, {
        data: {
          qrCode: qrCode,
          studentId: studentUserId,
        },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(false)
      // Session could be deleted (not found) or marked as expired
      expect(data.errors).toEqual(expect.arrayContaining([
        expect.stringMatching(/Session (not found|has expired)/),
      ]))

      console.log('QR code correctly invalidated after session end')
    })

    test('Step 12: Clean up - Delete test subject', async ({ request }) => {
      await authenticateUser(request, 'agusmontoya@gmail.com', 'test1234')

      const response = await request.delete(`${BASE_URL}/api/subjects/${subjectId}`)

      expect(response.status()).toBe(200)

      console.log('Test subject deleted')
    })
  })
})
