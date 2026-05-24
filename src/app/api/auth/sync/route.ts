import { NextRequest } from 'next/server'
import { ok, unauthorized, serverError } from '@/lib/api-response'
import { getServerSession, upsertUserFromSupabase } from '@/lib/auth-helpers'

// POST /api/auth/sync — Sync Supabase user → Prisma user
// Call this after login to ensure Prisma record exists
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return unauthorized()

    const user = await upsertUserFromSupabase(
      session.id,
      session.email ?? '',
      session.user_metadata?.name ?? session.user_metadata?.full_name
    )

    return ok(user)
  } catch (e) {
    return serverError(e)
  }
}
