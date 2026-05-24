import { NextRequest, NextResponse } from 'next/server'
import { verifyStripeWebhook } from '@/lib/payment'
import { holdEscrow, refundEscrow } from '@/lib/escrow'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@/lib/prisma-enums'

// POST /api/webhooks/stripe — รับ Stripe webhook events
// ต้องตั้งค่า Stripe Dashboard → Webhooks → endpoint URL
// Events: checkout.session.completed, payment_intent.payment_failed,
//         charge.dispute.created, charge.refunded

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event
  try {
    event = verifyStripeWebhook(body, signature)
  } catch (err) {
    console.error('[Stripe Webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`)

  try {
    switch (event.type) {

      // ── ชำระผ่าน Checkout Session เสร็จ ─────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as {
          id: string
          payment_intent: string
          metadata: { orderId?: string; orderNumber?: string }
          customer_email: string
          amount_total: number
        }
        const orderId = session.metadata?.orderId
        if (!orderId) break

        const order = await prisma.order.findUnique({
          where:  { id: orderId },
          select: { id: true, buyerId: true, totalTHB: true, paymentStatus: true },
        })

        if (!order || order.paymentStatus === PaymentStatus.ESCROW_HELD) break

        await holdEscrow({
          orderId,
          stripePaymentId: session.payment_intent,
          stripeSessionId: session.id,
          amountTHB:       (session.amount_total ?? 0) / 100,
          provider:        'stripe',
          buyerId:         order.buyerId,
        })
        break
      }

      // ── ชำระผ่าน PromptPay เสร็จ ─────────────────────────
      case 'payment_intent.succeeded': {
        const intent = event.data.object as {
          id: string
          metadata: { orderId?: string }
          amount: number
          payment_method_types: string[]
        }
        const orderId = intent.metadata?.orderId
        if (!orderId) break

        // ถ้าเป็น PromptPay (ไม่ใช่ checkout session — จัดการแล้วข้างบน)
        const isPromptPay = intent.payment_method_types?.includes('promptpay')
        if (!isPromptPay) break

        const order = await prisma.order.findUnique({
          where:  { id: orderId },
          select: { id: true, buyerId: true, paymentStatus: true },
        })

        if (!order || order.paymentStatus === PaymentStatus.ESCROW_HELD) break

        await holdEscrow({
          orderId,
          stripePaymentId: intent.id,
          amountTHB:       intent.amount / 100,
          provider:        'promptpay',
          buyerId:         order.buyerId,
        })
        break
      }

      // ── การชำระล้มเหลว ────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as {
          metadata: { orderId?: string }
          last_payment_error?: { message?: string }
        }
        const orderId = intent.metadata?.orderId
        if (!orderId) break

        await prisma.notification.create({
          data: {
            userId: (await prisma.order.findUnique({
              where:  { id: orderId },
              select: { buyerId: true },
            }))?.buyerId ?? '',
            type:    'ORDER_UPDATE',
            title:   '❌ การชำระเงินล้มเหลว',
            message: `กรุณาตรวจสอบข้อมูลบัตรและลองใหม่: ${intent.last_payment_error?.message ?? 'Unknown error'}`,
            data:    { orderId, action: 'payment_failed' },
          },
        }).catch(() => {}) // don't fail webhook on notification error
        break
      }

      // ── มีการ Dispute / Chargeback ────────────────────────
      case 'charge.dispute.created': {
        const dispute = event.data.object as {
          charge:  string
          amount:  number
          reason:  string
          metadata?: { orderId?: string }
        }

        // หา order จาก payment intent
        const order = await prisma.order.findFirst({
          where:   { stripePaymentId: { not: null } },
          orderBy: { createdAt: 'desc' },
        }).catch(() => null)

        if (order) {
          // สร้าง fraud alert อัตโนมัติ
          await prisma.fraudAlert.create({
            data: {
              coinId:      order.coinId,
              userId:      order.buyerId,
              severity:    'HIGH',
              type:        'chargeback_dispute',
              description: `Stripe dispute: ${dispute.reason} — amount ฿${dispute.amount / 100}`,
              evidence:    { chargeId: dispute.charge, reason: dispute.reason },
            },
          }).catch(() => {})
        }
        break
      }

      // ── Refund จาก Stripe ─────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as {
          payment_intent: string
          amount_refunded: number
        }

        const order = await prisma.order.findFirst({
          where: { stripePaymentId: charge.payment_intent },
        })

        if (order && order.paymentStatus !== 'REFUNDED') {
          await refundEscrow({
            orderId:    order.id,
            reason:     'Stripe refund issued',
            refundedBy: 'admin',
            amountTHB:  charge.amount_refunded / 100,
          }).catch(() => {})
        }
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Handler error:', error)
    // ส่ง 200 เสมอ เพื่อไม่ให้ Stripe retry แบบ infinite loop
    return NextResponse.json({ received: true, error: 'Handler error' })
  }
}

// Stripe webhook ต้องการ raw body — ปิด Next.js body parsing
export const config = { api: { bodyParser: false } }
