import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, unauthorized, forbidden, badRequest, serverError } from '@/lib/api-response'
import { updateCertSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/certificates/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: {
        coin:   { include: { seller: { select: { id: true, name: true, avatarUrl: true } } } },
        expert: { select: { id: true, name: true, avatarUrl: true, isVerifiedExpert: true } },
      },
    })
    if (!cert) return notFound('Certificate not found')
    return ok(cert)
  } catch (e) {
    return serverError(e)
  }
}

// PATCH /api/certificates/[id] — Approve or reject (expert/admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'EXPERT' && user.role !== 'ADMIN') return forbidden()

    const { id } = await params
    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: { coin: true },
    })
    if (!cert) return notFound('Certificate not found')
    if (cert.expertId !== user.id && user.role !== 'ADMIN') return forbidden()

    const body   = await req.json()
    const parsed = updateCertSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const isApproved = parsed.data.status === 'APPROVED'

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.certificate.update({
        where: { id },
        data:  {
          status:          parsed.data.status,
          rejectionReason: parsed.data.rejectionReason,
          issuedAt:        isApproved ? new Date() : null,
        },
      })

      // Update coin authentication status
      await tx.coin.update({
        where: { id: cert.coinId },
        data:  { isAuthenticated: isApproved },
      })

      // Notify coin seller
      await tx.notification.create({
        data: {
          userId:  cert.coin.sellerId,
          type:    'CERT_UPDATE',
          title:   isApproved ? '✅ ใบรับรองได้รับการอนุมัติ' : '❌ ใบรับรองถูกปฏิเสธ',
          message: isApproved
            ? `เหรียญ "${cert.coin.titleTh}" ได้รับการรับรองเป็นของแท้แล้ว`
            : `เหรียญ "${cert.coin.titleTh}" ไม่ผ่านการรับรอง: ${parsed.data.rejectionReason ?? ''}`,
          data: { certId: id, coinId: cert.coinId },
        },
      })

      return c
    })

    return ok(updated)
  } catch (e) {
    return serverError(e)
  }
}
