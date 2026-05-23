import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { createCoinSchema, coinFilterSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'
import { generateCoinSlug } from '@/lib/slug'
import { CoinStatus } from '@/lib/prisma-enums'

// GET /api/coins — List coins with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const params = coinFilterSchema.safeParse(Object.fromEntries(searchParams))
    if (!params.success) return badRequest(params.error.message)

    const {
      page, limit, q, monk, province, condition, status,
      minPrice, maxPrice, minYear, maxYear, certified,
      isAuction, sellerId, sort,
    } = params.data

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      status: status ?? { in: [CoinStatus.AVAILABLE, CoinStatus.RESERVED] },
      ...(q && {
        OR: [
          { titleTh: { contains: q, mode: 'insensitive' } },
          { titleEn: { contains: q, mode: 'insensitive' } },
          { monkNameTh: { contains: q, mode: 'insensitive' } },
          { monkNameEn: { contains: q, mode: 'insensitive' } },
          { templeTh: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
        ],
      }),
      ...(monk && {
        OR: [
          { monkNameTh: { contains: monk, mode: 'insensitive' } },
          { monkNameEn: { contains: monk, mode: 'insensitive' } },
        ],
      }),
      ...(province && { province: { contains: province, mode: 'insensitive' } }),
      ...(condition && { condition }),
      ...(minPrice !== undefined && { priceTHB: { gte: minPrice } }),
      ...(maxPrice !== undefined && { priceTHB: { lte: maxPrice } }),
      ...(minYear !== undefined && { yearTh: { gte: minYear } }),
      ...(maxYear !== undefined && { yearTh: { lte: maxYear } }),
      ...(certified !== undefined && { isAuthenticated: certified }),
      ...(isAuction !== undefined && { isAuction }),
      ...(sellerId && { sellerId }),
    }

    // Build orderBy
    const orderBy: Record<string, unknown> =
      sort === 'price_asc'  ? { priceTHB: 'asc' } :
      sort === 'price_desc' ? { priceTHB: 'desc' } :
      sort === 'popular'    ? { viewCount: 'desc' } :
      sort === 'oldest'     ? { createdAt: 'asc' } :
                              { createdAt: 'desc' }

    const [coins, total] = await Promise.all([
      prisma.coin.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatarUrl: true, rating: true, isVerifiedSeller: true } },
          certificate: { select: { status: true, issuedAt: true } },
          monk: { select: { id: true, nameTh: true, nameEn: true } },
          _count: { select: { watchlistItems: true } },
        },
      }),
      prisma.coin.count({ where }),
    ])

    return ok(coins, {
      total,
      page,
      limit,
      hasMore: skip + coins.length < total,
    })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/coins — Create coin
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const parsed = createCoinSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const data = parsed.data
    const slug = await generateCoinSlug(data.titleEn, data.yearCe)

    const coin = await prisma.coin.create({
      data: {
        ...data,
        slug,
        sellerId: user.id,
        priceTHB: data.priceTHB,
        sizeMm: data.sizeMm,
        weightGram: data.weightGram,
        status: CoinStatus.DRAFT,
      },
    })

    return created(coin)
  } catch (e) {
    return serverError(e)
  }
}
