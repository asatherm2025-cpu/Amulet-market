import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { z } from 'zod'

const schema = z.object({
  page:          z.coerce.number().min(1).default(1),
  limit:         z.coerce.number().min(1).max(100).default(20),
  status:        z.string().optional(),
  paymentStatus: z.string().optional(),
  q:             z.string().optional(),
  from:          z.string().optional(),
  to:            z.string().optional(),
})

// GET /api/admin/orders — All orders with filters
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const parsed = schema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) return badRequest(parsed.error.message)

    const { page, limit, status, paymentStatus, q, from, to } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      ...(status        && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(from || to)   && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to   && { lte: new Date(to) }),
        },
      },
      ...(q && {
        OR: [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { buyer:  { name:  { contains: q, mode: 'insensitive' } } },
          { buyer:  { email: { contains: q, mode: 'insensitive' } } },
          { seller: { name:  { contains: q, mode: 'insensitive' } } },
        ],
      }),
    }

    const [orders, total, revenue] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          coin:   { select: { id: true, titleTh: true, images: true } },
          buyer:  { select: { id: true, name: true, email: true, country: true } },
          seller: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({ where, _sum: { totalTHB: true } }),
    ])

    return ok(
      { orders, totalRevenue: Number(revenue._sum.totalTHB ?? 0) },
      { total, page, limit, hasMore: skip + orders.length < total }
    )
  } catch (e) {
    return serverError(e)
  }
}
