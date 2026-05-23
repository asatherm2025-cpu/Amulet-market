import { NextRequest } from 'next/server'
import { ok, badRequest, unauthorized, notFound, conflict, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { releaseEscrow } from '@/lib/escrow'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus } from '@/lib/prisma-enums'

// POST /api/escrow/[orderId]/release — ผู้ซื้อยืนยันรับของ → release เงินให้ seller
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { orderId } = await params

    // ตรวจสอบ order
    const order = await prisma.order.findUnique({
      where:   { id: orderId },
      select: {
        id:            true,
        buyerId:       true,
        sellerId:      true,
        status:        true,
        paymentStatus: true,
        coin:          { select: { titleTh: true } },
      },
    })

    if (!order) return notFound('Order not found')

    // เฉพาะ buyer หรือ admin เท่านั้นที่ release ได้
    const isBuyer = order.buyerId === user.id
    const isAdmin = user.role === 'ADMIN'
    if (!isBuyer && !isAdmin) return unauthorized('Only buyer or admin can release escrow')

    // ตรวจสอบสถานะ
    if (order.paymentStatus !== PaymentStatus.ESCROW_HELD) {
      return conflict(`Cannot release: payment status is "${order.paymentStatus}"`)
    }
    if (order.status === OrderStatus.COMPLETED) {
      return conflict('Order already completed')
    }
    if (order.status === OrderStatus.REFUNDED) {
      return conflict('Order already refunded')
    }

    const result = await releaseEscrow({
      orderId,
      buyerId:    order.buyerId,
      releasedBy: isAdmin ? 'admin' : 'buyer',
    })

    return ok({
      orderId,
      message:      'Escrow released successfully',
      sellerPayout: result.sellerPayout,
      status:       result.order.status,
    })
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes('Forbidden'))    return unauthorized(e.message)
      if (e.message.includes('Cannot release')) return conflict(e.message)
      if (e.message.includes('not found'))    return notFound(e.message)
    }
    return serverError(e)
  }
}
