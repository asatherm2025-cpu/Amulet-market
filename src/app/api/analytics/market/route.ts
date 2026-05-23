import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, serverError } from '@/lib/api-response'

// GET /api/analytics/market — ภาพรวมตลาดสาธารณะ (no auth required)
export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') ?? '30d'
    const days   = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const from   = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalAvailable,
      totalSoldPeriod,
      avgPricePeriod,
      topMonks,
      priceRanges,
      recentSales,
      conditionBreakdown,
    ] = await Promise.all([
      // จำนวนเหรียญที่มีขาย
      prisma.coin.count({ where: { status: 'AVAILABLE' } }),

      // เหรียญที่ขายในช่วง
      prisma.order.count({
        where: { status: 'COMPLETED', createdAt: { gte: from } },
      }),

      // ราคาเฉลี่ยที่ขายได้
      prisma.order.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: from } },
        _avg: { amountTHB: true },
        _sum: { amountTHB: true },
      }),

      // เกจิยอดนิยม (by coin count)
      prisma.coin.groupBy({
        by:      ['monkNameTh', 'monkNameEn'],
        where:   { status: { in: ['AVAILABLE', 'SOLD'] } },
        _count:  { id: true },
        _avg:    { priceTHB: true },
        orderBy: { _count: { id: 'desc' } },
        take:    8,
      }),

      // การกระจายช่วงราคา
      prisma.$queryRaw<{ range: string; count: number }[]>`
        SELECT
          CASE
            WHEN price_thb < 1000     THEN 'ต่ำกว่า ฿1K'
            WHEN price_thb < 5000     THEN '฿1K–5K'
            WHEN price_thb < 10000    THEN '฿5K–10K'
            WHEN price_thb < 50000    THEN '฿10K–50K'
            WHEN price_thb < 100000   THEN '฿50K–100K'
            ELSE 'มากกว่า ฿100K'
          END AS range,
          COUNT(*)::int AS count
        FROM coins
        WHERE status = 'AVAILABLE'
        GROUP BY range
        ORDER BY MIN(price_thb) ASC
      `.catch(() => []),

      // ราคาขายล่าสุด 10 รายการ
      prisma.order.findMany({
        where:   { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take:    10,
        select: {
          amountTHB:   true,
          completedAt: true,
          coin: {
            select: {
              titleTh:     true,
              monkNameTh:  true,
              images:      true,
              condition:   true,
            },
          },
        },
      }),

      // สภาพเหรียญ breakdown
      prisma.coin.groupBy({
        by:      ['condition'],
        where:   { status: 'AVAILABLE' },
        _count:  { id: true },
        _avg:    { priceTHB: true },
      }),
    ])

    return ok({
      overview: {
        totalAvailable,
        soldInPeriod:  totalSoldPeriod,
        avgSalePrice:  Math.round(Number(avgPricePeriod._avg.amountTHB ?? 0)),
        totalVolume:   Math.round(Number(avgPricePeriod._sum.amountTHB ?? 0)),
        period,
      },
      topMonks: topMonks.map(m => ({
        nameTh:   m.monkNameTh,
        nameEn:   m.monkNameEn,
        count:    m._count.id,
        avgPrice: Math.round(Number(m._avg.priceTHB ?? 0)),
      })),
      priceRanges,
      recentSales: recentSales.map(s => ({
        price:       Number(s.amountTHB),
        soldAt:      s.completedAt,
        coinTitle:   s.coin?.titleTh,
        monkName:    s.coin?.monkNameTh,
        coinImage:   s.coin?.images?.[0],
        condition:   s.coin?.condition,
      })),
      conditionBreakdown: conditionBreakdown.map(c => ({
        condition: c.condition,
        count:     c._count.id,
        avgPrice:  Math.round(Number(c._avg.priceTHB ?? 0)),
      })),
    })
  } catch (e) {
    return serverError(e)
  }
}
