import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { z } from 'zod'

const schema = z.object({
  status:    z.enum(['AVAILABLE','PENDING_REVIEW','DELISTED']).optional(),
  fraudScore: z.number().min(0).max(100).optional(),
  notes:     z.string().max(500).optional(),
})

// PATCH /api/admin/coins/[id] — Approve / Reject / Delist coin
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser()
    if (!admin) return unauthorized()
    if (admin.role !== 'ADMIN') return forbidden()

    const { id } = await params
    const coin = await prisma.coin.findUnique({
      where: { id },
      select: { id: true, sellerId: true, titleTh: true, status: true },
    })
    if (!coin) return notFound('Coin not found')

    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const updated = await prisma.coin.update({
      where: { id },
      data:  { status: parsed.data.status, fraudScore: parsed.data.fraudScore },
    })

    // Notify seller on approval/rejection
    if (parsed.data.status) {
      const isApproved = parsed.data.status === 'AVAILABLE'
      const isDelisted = parsed.data.status === 'DELISTED'

      if (isApproved || isDelisted) {
        await prisma.notification.create({
          data: {
            userId:  coin.sellerId,
            type:    'ORDER_UPDATE',
            title:   isApproved ? '✅ เหรียญได้รับการอนุมัติ' : '❌ เหรียญถูกระงับ',
            message: isApproved
              ? `เหรียญ "${coin.titleTh}" ได้รับการอนุมัติและแสดงในตลาดแล้ว`
              : `เหรียญ "${coin.titleTh}" ถูกระงับ: ${parsed.data.notes ?? 'ละเมิดนโยบาย'}`,
            data: { coinId: id, action: parsed.data.status },
          },
        })
      }
    }

    return ok(updated)
  } catch (e) {
    return serverError(e)
  }
}
