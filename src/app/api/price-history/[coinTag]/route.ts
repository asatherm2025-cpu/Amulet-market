import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { z } from 'zod'

const postSchema = z.object({
  priceTHB: z.number().positive(),
  source:   z.enum(['auction', 'marketplace', 'manual']).default('marketplace'),
  coinId:   z.string().uuid().optional(),
})

// GET /api/price-history/[coinTag] — ประวัติราคาสำหรับ chart
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coinTag: string }> }
) {
  try {
    const { coinTag } = await params
    const period = req.nextUrl.searchParams.get('period') ?? '1y'

    const days =
      period === '3m' ? 90 :
      period === '6m' ? 180 :
      period === '2y' ? 730 :
      period === 'all' ? 9999 : 365

    const from = days === 9999
      ? new Date('2000-01-01')
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const history = await prisma.priceHistory.findMany({
      where: {
        coinTag,
        recordedAt: { gte: from },
      },
      orderBy: { recordedAt: 'asc' },
      select:  { priceTHB: true, source: true, recordedAt: true },
    })

    if (!history.length) return ok({ coinTag, history: [], stats: null })

    const prices = history.map(h => Number(h.priceTHB))
    const first  = prices[0]
    const last   = prices[prices.length - 1]
    const change = last - first
    const changePct = first > 0 ? ((change / first) * 100).toFixed(2) : '0'

    return ok({
      coinTag,
      history: history.map(h => ({
        price:      Number(h.priceTHB),
        source:     h.source,
        recordedAt: h.recordedAt,
      })),
      stats: {
        current:   last,
        open:      first,
        high:      Math.max(...prices),
        low:       Math.min(...prices),
        change,
        changePct:  Number(changePct),
        isPositive: change >= 0,
        dataPoints: history.length,
        period,
      },
    })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/price-history/[coinTag] — บันทึกราคาใหม่ (admin/seller)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ coinTag: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { coinTag } = await params
    const body   = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const entry = await prisma.priceHistory.create({
      data: {
        coinTag,
        priceTHB:  parsed.data.priceTHB,
        source:    parsed.data.source,
        coinId:    parsed.data.coinId,
      },
    })

    return created(entry)
  } catch (e) {
    return serverError(e)
  }
}
