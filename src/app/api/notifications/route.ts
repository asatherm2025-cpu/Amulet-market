import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, unauthorized, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/notifications — My notifications
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { searchParams } = req.nextUrl
    const page    = Number(searchParams.get('page') ?? 1)
    const limit   = Number(searchParams.get('limit') ?? 20)
    const unread  = searchParams.get('unread') === 'true'
    const skip    = (page - 1) * limit

    const where = {
      userId: user.id,
      ...(unread && { isRead: false }),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ])

    return ok(
      { notifications, unreadCount },
      { total, page, limit, hasMore: skip + notifications.length < total }
    )
  } catch (e) {
    return serverError(e)
  }
}
