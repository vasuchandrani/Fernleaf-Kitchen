'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) return { error: 'The application API is not configured.' }

    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      return { error: 'Invalid credentials. Please try again.' }
    }

    const data = await res.json()
    
    // Fetch user profile to get their role
    const meRes = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` }
    })
    
    const user = await meRes.json()

    // Next.js 15 requires awaiting cookies()
    const cookieStore = await cookies()
    cookieStore.set('token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    cookieStore.set('role', user.role.name, {
      path: '/',
    })

    const roleName = user.role.name.toLowerCase()
    
    return { success: true, redirectUrl: `/${roleName}` }
  } catch (err) {
    console.error(err)
    return { error: 'Failed to connect to the server.' }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('role')
  redirect('/login')
}
