import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, unauthorized, forbidden, badRequest, serverError } from '@/lib/api-response'
import { updateCoinSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/coins/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const coin = await prisma.coin.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true, name: true, nameEn: true, avatarUrl: true,
            rating: true, totalSales: true, isVerifiedSeller: true,
            createdAt: true,
          },
        },
        monk: true,
        certificate: {
          include: {
            expert: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        priceHistory: { orderBy: { recordedAt: 'asc' } },
        aiAnalysis: true,
        _count: { select: { watchlistItems: true } },
      },
    })

    if (!coin) return notFound('Coin not found')

    // Increment view count (fire and forget)
    prisma.coin.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {})

    return ok(coin)
  } catch (e) {
    return serverError(e)
  }
}

// PATCH /api/coins/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await params
    const coin = await prisma.coin.findUnique({ where: { id } })
    if (!coin) return notFound('Coin not found')

    // Only seller or admin can update
    if (coin.sellerId !== user.id && user.role !== 'ADMIN') return forbidden()

    const body = await req.json()
    const parsed = updateCoinSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const updated = await prisma.coin.update({
      where: { id },
      data: {
        ...parsed.data,
        priceTHB: parsed.data.priceTHB,
        sizeMm: parsed.data.sizeMm,
        weightGram: parsed.data.weightGram,
      },
    })

    return ok(updated)
  } catch (e) {
    return serverError(e)
  }
}

// DELETE /api/coins/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await params
    const coin = await prisma.coin.findUnique({ where: { id } })
    if (!coin) return notFound('Coin not found')

    if (coin.sellerId !== user.id && user.role !== 'ADMIN') return forbidden()

    // Soft delete — set status to DELISTED
    const updated = await prisma.coin.update({
      where: { id },
      data: { status: 'DELISTED' },
    })

    return ok(updated)
  } catch (e) {
    return serverError(e)
  }
}
