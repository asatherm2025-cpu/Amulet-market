import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, notFound, conflict, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { createStripeCheckout, calculateFees } from '@/lib/payment'
import { OrderStatus } from '@/lib/prisma-enums'
import { z } from 'zod'

const schema = z.object({
  orderId:        z.string().uuid(),
  isInternational: z.boolean().default(false),
})

// POST /api/payment/checkout — สร้าง Stripe Checkout Session
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const { orderId, isInternational } = parsed.data

    // ดึง order พร้อมข้อมูล
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        coin: { select: { id: true, titleTh: true, images: true, priceTHB: true } },
      },
    })

    if (!order) return notFound('Order not found')
    if (order.buyerId !== user.id) return unauthorized('Not your order')
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      return conflict(`Order already in status: ${order.status}`)
    }

    // คำนวณค่าใช้จ่ายใหม่ตาม international flag
    const fees = calculateFees(Number(order.coin.priceTHB), isInternational)

    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const coinImage = order.coin.images?.[0]

    // สร้าง Stripe Checkout Session
    const session = await createStripeCheckout({
      orderId:     order.id,
      orderNumber: order.orderNumber,
      coinTitleTh: order.coin.titleTh,
      coinImage,
      totalTHB:    fees.total,
      buyerEmail:  user.email,
      successUrl:  `${appUrl}/checkout/${order.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl:   `${appUrl}/checkout/${order.id}?cancelled=true`,
    })

    // บันทึก session ID ไว้ใน order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeSessionId: session.id,
        shippingFeeTHB:  fees.shipping,
        escrowFeeTHB:    fees.platformFee,
        totalTHB:        fees.total,
      },
    })

    return created({
      sessionId:  session.id,
      sessionUrl: session.url,
      fees,
    })
  } catch (e) {
    return serverError(e)
  }
}
