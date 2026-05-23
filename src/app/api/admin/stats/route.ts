import { prisma } from '@/lib/prisma'
import { ok, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { CoinStatus, OrderStatus } from '@prisma/client'

// GET /api/admin/stats — Platform statistics
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const [
      totalUsers,
      totalCoins,
      totalOrders,
      totalRevenue,
      activeAuctions,
      pendingCerts,
      pendingFraud,
      newUsersThisMonth,
      salesThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.coin.count({ where: { status: CoinStatus.AVAILABLE } }),
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.order.aggregate({
        where:  { status: OrderStatus.COMPLETED },
        _sum:   { totalTHB: true },
      }),
      prisma.auction.count({ where: { status: 'LIVE' } }),
      prisma.certificate.count({ where: { status: 'PENDING' } }),
      prisma.fraudAlert.count({ where: { isResolved: false } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          status:    OrderStatus.COMPLETED,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum:   { totalTHB: true },
        _count: { id: true },
      }),
    ])

    return ok({
      users: {
        total:        totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      coins: {
        available: totalCoins,
      },
      orders: {
        completed: totalOrders,
        revenue:   Number(totalRevenue._sum.totalTHB ?? 0),
      },
      auctions: {
        active: activeAuctions,
      },
      certs: {
        pending: pendingCerts,
      },
      fraud: {
        unresolved: pendingFraud,
      },
      monthlyRevenue: {
        amount: Number(salesThisMonth._sum.totalTHB ?? 0),
        orders: salesThisMonth._count.id,
      },
    })
  } catch (e) {
    return serverError(e)
  }
}
