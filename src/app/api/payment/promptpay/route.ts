import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { created, badRequest, unauthorized, notFound, conflict, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { createPromptPayIntent } from '@/lib/payment'
import { OrderStatus } from '@/lib/prisma-enums'
import { z } from 'zod'

const schema = z.object({ orderId: z.string().uuid() })

// POST /api/payment/promptpay — สร้าง PromptPay QR
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: { coin: { select: { titleTh: true } } },
    })

    if (!order) return notFound('Order not found')
    if (order.buyerId !== user.id) return unauthorized('Not your order')
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      return conflict(`Order already in status: ${order.status}`)
    }

    const intent = await createPromptPayIntent({
      orderId:     order.id,
      orderNumber: order.orderNumber,
      totalTHB:    Number(order.totalTHB),
      buyerEmail:  user.email,
    })

    // QR code data อยู่ใน next_action.promptpay_display_qr_code
    const qrData = (intent.next_action as { promptpay_display_qr_code?: { image_url_png?: string; data?: string } })
      ?.promptpay_display_qr_code

    // บันทึก payment intent id
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentId: intent.id },
    })

    return created({
      paymentIntentId: intent.id,
      clientSecret:    intent.client_secret,
      qrImageUrl:      qrData?.image_url_png,
      qrData:          qrData?.data,
      amount:          Number(order.totalTHB),
      expiresAt:       new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 นาที
    })
  } catch (e) {
    return serverError(e)
  }
}
