import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, forbidden, conflict, serverError } from '@/lib/api-response'
import { createCertSchema, updateCertSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'
import { CertStatus } from '@prisma/client'

// GET /api/certificates — List pending (experts/admin)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'EXPERT' && user.role !== 'ADMIN') return forbidden()

    const page   = Number(req.nextUrl.searchParams.get('page') ?? 1)
    const limit  = Number(req.nextUrl.searchParams.get('limit') ?? 20)
    const status = (req.nextUrl.searchParams.get('status') as CertStatus) ?? CertStatus.PENDING
    const skip   = (page - 1) * limit

    const [certs, total] = await Promise.all([
      prisma.certificate.findMany({
        where:   { status, ...(user.role === 'EXPERT' && { expertId: user.id }) },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          coin:   { select: { id: true, titleTh: true, images: true, priceTHB: true } },
          expert: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.certificate.count({ where: { status } }),
    ])

    return ok(certs, { total, page, limit, hasMore: skip + certs.length < total })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/certificates — Request certification
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body   = await req.json()
    const parsed = createCertSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const { coinId, notesTh, notesEn, certImageUrl, expiresAt } = parsed.data

    // Validate coin ownership
    const coin = await prisma.coin.findUnique({ where: { id: coinId } })
    if (!coin) return badRequest('Coin not found')
    if (coin.sellerId !== user.id && user.role !== 'ADMIN') return forbidden()

    // Check no pending cert
    const existing = await prisma.certificate.findUnique({ where: { coinId } })
    if (existing) return conflict('Certificate already exists for this coin')

    // Find available expert (round-robin or admin-assigned)
    const expert = await prisma.user.findFirst({
      where: { role: 'EXPERT', isVerifiedExpert: true, isBanned: false },
      orderBy: { certificates: { _count: 'asc' } },
    })

    const cert = await prisma.certificate.create({
      data: {
        coinId,
        expertId: expert?.id ?? user.id, // fallback to requester if no expert
        notesTh,
        notesEn,
        certImageUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    })

    // Notify expert
    if (expert) {
      await prisma.notification.create({
        data: {
          userId:  expert.id,
          type:    'CERT_UPDATE',
          title:   'มีคำขอใบรับรองใหม่',
          message: `เหรียญ "${coin.titleTh}" รอการตรวจสอบ`,
          data:    { certId: cert.id, coinId },
        },
      })
    }

    return created(cert)
  } catch (e) {
    return serverError(e)
  }
}
