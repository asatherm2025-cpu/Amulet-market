import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { z } from 'zod'

const updateSchema = z.object({
  role:             z.enum(['BUYER', 'SELLER', 'EXPERT', 'ADMIN']).optional(),
  isVerifiedSeller: z.boolean().optional(),
  isVerifiedExpert: z.boolean().optional(),
  isBanned:         z.boolean().optional(),
  banReason:        z.string().max(500).optional(),
})

// PATCH /api/admin/users/[id] — Update user role / ban / verify
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser()
    if (!admin) return unauthorized()
    if (admin.role !== 'ADMIN') return forbidden()

    const { id } = await params
    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return notFound('User not found')

    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const data = parsed.data

    // ถ้า unban ต้องล้าง banReason ด้วย
    if (data.isBanned === false) data.banReason = undefined

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true, role: true,
        isVerifiedSeller: true, isVerifiedExpert: true,
        isBanned: true, banReason: true, updatedAt: true,
      },
    })

    // Notify user if banned/unbanned
    if (data.isBanned !== undefined) {
      await prisma.notification.create({
        data: {
          userId:  id,
          type:    'SYSTEM',
          title:   data.isBanned ? '⛔ บัญชีถูกระงับ' : '✅ บัญชีถูกคืนสถานะ',
          message: data.isBanned
            ? `บัญชีของคุณถูกระงับ: ${data.banReason ?? 'ละเมิดข้อกำหนด'}`
            : 'บัญชีของคุณได้รับการคืนสถานะแล้ว',
          data: { action: data.isBanned ? 'banned' : 'unbanned' },
        },
      })
    }

    return ok(updated)
  } catch (e) {
    return serverError(e)
  }
}

// GET /api/admin/users/[id] — User detail with full stats
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser()
    if (!admin) return unauthorized()
    if (admin.role !== 'ADMIN') return forbidden()

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            coins:           true,
            orders:          true,
            sales:           true,
            reviewsReceived: true,
            bids:            true,
            fraudAlerts:     true,
          },
        },
        coins: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, titleTh: true, priceTHB: true, status: true },
        },
        sales: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, totalTHB: true, status: true },
        },
      },
    })

    if (!user) return notFound('User not found')
    return ok(user)
  } catch (e) {
    return serverError(e)
  }
}
