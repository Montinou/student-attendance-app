import { test, expect } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Helper function to get authenticated teacher session
async function getTeacherContext(request: any) {
  const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: 'agusmontoya@gmail.com',
      password: 'test1234',
    },
  })

  expect(loginResponse.ok()).toBeTruthy()
  const { user } = await loginResponse.json()
  return { userId: user.id }
}

test.describe('Subjects API Routes', () => {
  let testSubjectId: string

  test('GET /api/subjects - get all subjects for teacher', async ({ request }) => {
    const { userId } = await getTeacherContext(request)

    const response = await request.get(`${BASE_URL}/api/subjects?teacherId=${userId}`)

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('subjects')
    expect(Array.isArray(data.subjects)).toBeTruthy()
  })

  test('POST /api/subjects - create new subject as teacher', async ({ request }) => {
    await getTeacherContext(request)

    const newSubject = {
      name: 'Test Subject ' + Date.now(),
      code: 'TEST' + Date.now(),
      schedule: 'Monday 10:00-12:00',
      description: 'Test subject for API testing',
    }

    const response = await request.post(`${BASE_URL}/api/subjects`, {
      data: newSubject,
    })

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('subject')
    expect(data.subject).toHaveProperty('name', newSubject.name)
    expect(data.subject).toHaveProperty('code', newSubject.code)
    expect(data.subject).toHaveProperty('id')

    // Store for cleanup/further tests
    testSubjectId = data.subject.id
  })

  test('POST /api/subjects - validation error for missing fields', async ({ request }) => {
    await getTeacherContext(request)

    const response = await request.post(`${BASE_URL}/api/subjects`, {
      data: {
        name: 'Only Name',
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('required')
  })

  test('GET /api/subjects/[id] - get specific subject', async ({ request }) => {
    const { userId } = await getTeacherContext(request)

    // First get all subjects to find one
    const listResponse = await request.get(`${BASE_URL}/api/subjects?teacherId=${userId}`)
    const { subjects } = await listResponse.json()

    if (subjects.length > 0) {
      const subjectId = subjects[0].id

      const response = await request.get(`${BASE_URL}/api/subjects/${subjectId}`)

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('subject')
      expect(data.subject).toHaveProperty('id', subjectId)
    }
  })

  test('PATCH /api/subjects/[id] - update subject', async ({ request }) => {
    const { userId } = await getTeacherContext(request)

    // First get a subject
    const listResponse = await request.get(`${BASE_URL}/api/subjects?teacherId=${userId}`)
    const { subjects } = await listResponse.json()

    if (subjects.length > 0) {
      const subjectId = subjects[0].id

      const updateData = {
        name: 'Updated Subject Name',
        schedule: 'Tuesday 14:00-16:00',
      }

      const response = await request.patch(`${BASE_URL}/api/subjects/${subjectId}`, {
        data: updateData,
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('subject')
      expect(data.subject.name).toBe(updateData.name)
    }
  })

  test('DELETE /api/subjects/[id] - delete subject', async ({ request }) => {
    await getTeacherContext(request)

    // Create a subject to delete
    const createResponse = await request.post(`${BASE_URL}/api/subjects`, {
      data: {
        name: 'Subject to Delete',
        code: 'DEL' + Date.now(),
      },
    })

    const { subject } = await createResponse.json()

    // Delete it
    const response = await request.delete(`${BASE_URL}/api/subjects/${subject.id}`)

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('success', true)
  })
})
