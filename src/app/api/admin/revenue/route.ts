import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/admin/revenue — Revenue analytics
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const period = req.nextUrl.searchParams.get('period') ?? '30d'
    const days   = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
    const from   = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalRevenue,
      periodRevenue,
      revenueByDay,
      topSellers,
      topCoins,
      paymentMethods,
    ] = await Promise.all([
      // All-time total
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum:  { totalTHB: true },
        _count: { id: true },
      }),
      // Period revenue
      prisma.order.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: from } },
        _sum:  { totalTHB: true, escrowFeeTHB: true },
        _count: { id: true },
      }),
      // Daily revenue (last N days) — raw SQL via groupBy approximation
      prisma.$queryRaw<{ day: string; revenue: number; orders: number }[]>`
        SELECT
          DATE(created_at AT TIME ZONE 'Asia/Bangkok')::text AS day,
          SUM(total_thb)::float                              AS revenue,
          COUNT(*)::int                                      AS orders
        FROM orders
        WHERE status = 'COMPLETED'
          AND created_at >= ${from}
        GROUP BY DATE(created_at AT TIME ZONE 'Asia/Bangkok')
        ORDER BY day ASC
      `.catch(() => [] as { day: string; revenue: number; orders: number }[]),
      // Top 5 sellers
      prisma.order.groupBy({
        by:      ['sellerId'],
        where:   { status: 'COMPLETED', createdAt: { gte: from } },
        _sum:    { totalTHB: true },
        _count:  { id: true },
        orderBy: { _sum: { totalTHB: 'desc' } },
        take:    5,
      }).then(async rows => {
        const ids   = rows.map(r => r.sellerId)
        const users = await prisma.user.findMany({
          where:  { id: { in: ids } },
          select: { id: true, name: true, avatarUrl: true, rating: true },
        })
        return rows.map(r => ({
          seller:  users.find(u => u.id === r.sellerId),
          revenue: Number(r._sum.totalTHB ?? 0),
          orders:  r._count.id,
        }))
      }),
      // Top 5 coins by revenue
      prisma.order.groupBy({
        by:      ['coinId'],
        where:   { status: 'COMPLETED', createdAt: { gte: from } },
        _sum:    { amountTHB: true },
        orderBy: { _sum: { amountTHB: 'desc' } },
        take:    5,
      }).then(async rows => {
        const ids   = rows.map(r => r.coinId)
        const coins = await prisma.coin.findMany({
          where:  { id: { in: ids } },
          select: { id: true, titleTh: true, images: true, priceTHB: true },
        })
        return rows.map(r => ({
          coin:    coins.find(c => c.id === r.coinId),
          revenue: Number(r._sum.amountTHB ?? 0),
        }))
      }),
      // Payment method breakdown
      prisma.transaction.groupBy({
        by:      ['provider'],
        where:   { type: 'payment', status: 'success', createdAt: { gte: from } },
        _sum:    { amountTHB: true },
        _count:  { id: true },
      }),
    ])

    return ok({
      summary: {
        allTime: {
          revenue: Number(totalRevenue._sum.totalTHB ?? 0),
          orders:  totalRevenue._count.id,
        },
        period: {
          label:       period,
          revenue:     Number(periodRevenue._sum.totalTHB ?? 0),
          platformFee: Number(periodRevenue._sum.escrowFeeTHB ?? 0),
          orders:      periodRevenue._count.id,
        },
      },
      revenueByDay,
      topSellers,
      topCoins,
      paymentMethods: paymentMethods.map(p => ({
        provider: p.provider,
        revenue:  Number(p._sum.amountTHB ?? 0),
        count:    p._count.id,
      })),
    })
  } catch (e) {
    return serverError(e)
  }
}
