import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { User } from '@/lib/prisma-enums'

// ดึง Supabase session จาก server
export async function getServerSession() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  if (supabaseUrl.includes('placeholder')) return null

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ดึง Prisma User จาก supabase session
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession()
  if (!session) return null

  try {
    const user = await prisma.user.findUnique({
      where: { supabaseId: session.id },
    })
    return user
  } catch {
    return null
  }
}

// Require auth — throw ถ้าไม่ได้ login
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

// Require specific role
export async function requireRole(...roles: User['role'][]): Promise<User> {
  const user = await requireAuth()
  if (!roles.includes(user.role as User['role'])) throw new Error('FORBIDDEN')
  return user
}

// Upsert user จาก Supabase Auth (เรียกตอน login)
export async function upsertUserFromSupabase(supabaseId: string, email: string, name?: string) {
  return prisma.user.upsert({
    where: { supabaseId },
    update: { email, updatedAt: new Date() },
    create: {
      supabaseId,
      email,
      name: name || email.split('@')[0],
    },
  })
}
