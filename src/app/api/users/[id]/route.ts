import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, serverError } from '@/lib/api-response'

// GET /api/users/[id] — Public seller profile
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nameEn: true,
        avatarUrl: true,
        bio: true,
        country: true,
        isVerifiedSeller: true,
        isVerifiedExpert: true,
        rating: true,
        totalSales: true,
        createdAt: true,
        _count: {
          select: {
            coins: true,
            reviewsReceived: true,
          },
        },
        reviewsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            reviewer: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        coins: {
          where: { status: 'AVAILABLE' },
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true, titleTh: true, titleEn: true,
            images: true, priceTHB: true, condition: true,
            isAuthenticated: true,
          },
        },
      },
    })

    if (!user) return notFound('User not found')
    return ok(user)
  } catch (e) {
    return serverError(e)
  }
}
