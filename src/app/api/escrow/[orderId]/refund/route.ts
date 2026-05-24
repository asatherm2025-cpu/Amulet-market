import { NextRequest } from 'next/server'
import { ok, badRequest, unauthorized, notFound, conflict, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { refundEscrow } from '@/lib/escrow'
import { refundPayment } from '@/lib/payment'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@/lib/prisma-enums'
import { z } from 'zod'

const schema = z.object({
  reason: z.string().min(5).max(500),
})

// POST /api/escrow/[orderId]/refund — Admin คืนเงิน
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return unauthorized('Admin only')

    const { orderId } = await params
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const order = await prisma.order.findUnique({
      where:  { id: orderId },
      select: {
        id:             true,
        buyerId:        true,
        paymentStatus:  true,
        stripePaymentId: true,
        totalTHB:       true,
      },
    })

    if (!order) return notFound('Order not found')
    if (order.paymentStatus === PaymentStatus.RELEASED) {
      return conflict('Cannot refund: payment already released to seller')
    }
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      return conflict('Already refunded')
    }

    // 1. Issue Stripe refund
    if (order.stripePaymentId) {
      await refundPayment({
        paymentIntentId: order.stripePaymentId,
        reason:          'requested_by_customer',
      }).catch((err) => console.error('Stripe refund error:', err))
    }

    // 2. Update escrow state
    const result = await refundEscrow({
      orderId,
      reason:     parsed.data.reason,
      refundedBy: 'admin',
    })

    return ok({
      orderId,
      message:      'Refund issued successfully',
      refundAmount: result.refundAmount,
      status:       result.order.status,
    })
  } catch (e) {
    return serverError(e)
  }
}
