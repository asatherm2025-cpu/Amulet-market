import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'

// PATCH /api/fraud/[id]/resolve — Resolve fraud alert (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const { id } = await params
    const { resolution, banUser, delistCoin } = await req.json()

    const alert = await prisma.fraudAlert.findUnique({
      where: { id },
      include: { coin: true, user: true },
    })
    if (!alert) return notFound('Alert not found')

    await prisma.$transaction(async (tx) => {
      // Mark alert resolved
      await tx.fraudAlert.update({
        where: { id },
        data: {
          isResolved: true,
          resolvedBy:  user.id,
          resolvedAt:  new Date(),
          resolution,
        },
      })

      // Ban user if requested
      if (banUser && alert.userId) {
        await tx.user.update({
          where: { id: alert.userId },
          data:  { isBanned: true, banReason: resolution },
        })
      }

      // Delist coin if requested
      if (delistCoin && alert.coinId) {
        await tx.coin.update({
          where: { id: alert.coinId },
          data:  { status: 'DELISTED' },
        })
      }
    })

    return ok({ resolved: true })
  } catch (e) {
    return serverError(e)
  }
}
