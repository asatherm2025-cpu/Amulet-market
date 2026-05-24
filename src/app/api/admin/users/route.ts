import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { z } from 'zod'

const filterSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(100).default(20),
  role:     z.enum(['BUYER', 'SELLER', 'EXPERT', 'ADMIN']).optional(),
  q:        z.string().optional(),
  isBanned: z.coerce.boolean().optional(),
  country:  z.string().optional(),
  sort:     z.enum(['newest', 'oldest', 'sales', 'rating']).default('newest'),
})

// GET /api/admin/users — List all users
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const parsed = filterSchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams)
    )
    if (!parsed.success) return badRequest(parsed.error.message)

    const { page, limit, role, q, isBanned, country, sort } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      ...(role     && { role }),
      ...(isBanned !== undefined && { isBanned }),
      ...(country  && { country }),
      ...(q && {
        OR: [
          { name:  { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }),
    }

    const orderBy: Record<string, unknown> =
      sort === 'sales'  ? { totalSales: 'desc' } :
      sort === 'rating' ? { rating: 'desc' } :
      sort === 'oldest' ? { createdAt: 'asc' } :
                          { createdAt: 'desc' }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id:              true,
          name:            true,
          email:           true,
          role:            true,
          country:         true,
          avatarUrl:       true,
          isVerifiedSeller: true,
          isVerifiedExpert: true,
          isBanned:        true,
          banReason:       true,
          rating:          true,
          totalSales:      true,
          totalPurchases:  true,
          createdAt:       true,
          _count: {
            select: { coins: true, orders: true, sales: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return ok(users, { total, page, limit, hasMore: skip + users.length < total })
  } catch (e) {
    return serverError(e)
  }
}
