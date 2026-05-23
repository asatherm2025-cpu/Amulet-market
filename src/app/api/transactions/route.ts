import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, unauthorized, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { z } from 'zod'

const schema = z.object({
  page:  z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type:  z.enum(['payment', 'payout', 'refund', 'fee']).optional(),
})

// GET /api/transactions — ประวัติธุรกรรมของ user ปัจจุบัน
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { searchParams } = req.nextUrl
    const parsed = schema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return ok([], { total: 0 })
    }

    const { page, limit, type } = parsed.data
    const skip = (page - 1) * limit

    const where = {
      userId: user.id,
      ...(type && { type }),
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id:          true,
              orderNumber: true,
              coin: {
                select: { id: true, titleTh: true, images: true },
              },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return ok(transactions, {
      total,
      page,
      limit,
      hasMore: skip + transactions.length < total,
    })
  } catch (e) {
    return serverError(e)
  }
}
