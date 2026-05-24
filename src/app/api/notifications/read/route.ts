import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, unauthorized, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'

// PATCH /api/notifications/read — Mark as read
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { ids, all } = await req.json()

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data:  { isRead: true, readAt: new Date() },
      })
    } else if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data:  { isRead: true, readAt: new Date() },
      })
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    })

    return ok({ unreadCount })
  } catch (e) {
    return serverError(e)
  }
}
