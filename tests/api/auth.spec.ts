import { test, expect } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

test.describe('Auth API Routes', () => {
  test('POST /api/auth/login - successful teacher login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'agusmontoya@gmail.com',
        password: 'test1234',
      },
    })

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('user')
    expect(data).toHaveProperty('role', 'teacher')
    expect(data).toHaveProperty('redirectPath', '/teacher')
    expect(data.user).toHaveProperty('email', 'agusmontoya@gmail.com')
  })

  test('POST /api/auth/login - successful student login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'agusmontoya2@gmail.com',
        password: 'test1234',
      },
    })

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('user')
    expect(data).toHaveProperty('role', 'student')
    expect(data).toHaveProperty('redirectPath', '/student')
    expect(data.user).toHaveProperty('email', 'agusmontoya2@gmail.com')
  })

  test('POST /api/auth/login - invalid credentials', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      },
    })

    expect(response.status()).toBe(401)

    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('POST /api/auth/login - missing fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('required')
  })

  test('POST /api/auth/register - validation error for missing fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: 'newuser@example.com',
        password: 'password123',
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('required')
  })

  test('POST /api/auth/register - validation error for invalid role', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        role: 'admin',
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('Invalid role')
  })
})
