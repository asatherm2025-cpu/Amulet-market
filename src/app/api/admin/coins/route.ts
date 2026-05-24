import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { z } from 'zod'

const filterSchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT','PENDING_REVIEW','AVAILABLE','RESERVED','SOLD','DELISTED']).optional(),
  q:      z.string().optional(),
  sort:   z.enum(['newest','oldest','price_asc','price_desc','views']).default('newest'),
})

// GET /api/admin/coins — List all coins (admin view)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const parsed = filterSchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams)
    )
    if (!parsed.success) return badRequest(parsed.error.message)

    const { page, limit, status, q, sort } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      ...(status && { status }),
      ...(q && {
        OR: [
          { titleTh:     { contains: q, mode: 'insensitive' } },
          { monkNameTh:  { contains: q, mode: 'insensitive' } },
          { seller: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    }

    const orderBy: Record<string, unknown> =
      sort === 'price_asc'  ? { priceTHB: 'asc' } :
      sort === 'price_desc' ? { priceTHB: 'desc' } :
      sort === 'views'      ? { viewCount: 'desc' } :
      sort === 'oldest'     ? { createdAt: 'asc' } :
                              { createdAt: 'desc' }

    const [coins, total] = await Promise.all([
      prisma.coin.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          seller:      { select: { id: true, name: true, email: true } },
          certificate: { select: { status: true } },
          fraudAlerts: { where: { isResolved: false }, select: { id: true, severity: true } },
          _count:      { select: { watchlistItems: true } },
        },
      }),
      prisma.coin.count({ where }),
    ])

    return ok(coins, { total, page, limit, hasMore: skip + coins.length < total })
  } catch (e) {
    return serverError(e)
  }
}
