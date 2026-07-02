'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_SESSION_COOKIE, createSessionToken, verifyAdminPassword } from '@/lib/admin-auth'

export async function login(formData: FormData) {
  const password = String(formData.get('password') ?? '')

  if (!(await verifyAdminPassword(password))) {
    redirect('/admin/login?error=1')
  }

  const token = await createSessionToken()
  const store = await cookies()
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 24 * 7,
  })
  redirect('/admin')
}

export async function logout() {
  const store = await cookies()
  store.delete({ name: ADMIN_SESSION_COOKIE, path: '/admin' })
  redirect('/admin/login')
}
