import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, serverError } from '@/lib/api-response'

// GET /api/monks — List monks
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const q       = searchParams.get('q')
    const famous  = searchParams.get('famous') === 'true'
    const page    = Number(searchParams.get('page') ?? 1)
    const limit   = Number(searchParams.get('limit') ?? 50)
    const skip    = (page - 1) * limit

    const where = {
      ...(q && {
        OR: [
          { nameTh: { contains: q, mode: 'insensitive' as const } },
          { nameEn: { contains: q, mode: 'insensitive' as const } },
          { templeTh: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
      ...(famous && { isFamous: true }),
    }

    const [monks, total] = await Promise.all([
      prisma.monk.findMany({
        where,
        skip,
        take:    limit,
        orderBy: [{ isFamous: 'desc' }, { coinCount: 'desc' }],
      }),
      prisma.monk.count({ where }),
    ])

    return ok(monks, { total, page, limit, hasMore: skip + monks.length < total })
  } catch (e) {
    return serverError(e)
  }
}
