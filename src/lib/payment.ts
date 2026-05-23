// ============================================================
// SIAM COIN — PaymentService
// Stripe + PromptPay integration
// ============================================================

import Stripe from 'stripe'

// ── Stripe client (server-side only) ───────────────────────
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
}

// ── Fee calculation ─────────────────────────────────────────
export const FEES = {
  PLATFORM_RATE:  0.03,   // 3% escrow/platform fee
  SHIPPING_THB:   350,    // ค่าส่งพื้นฐาน (ในประเทศ)
  SHIPPING_INTL:  650,    // ค่าส่งต่างประเทศ
  THB_TO_SATANG:  100,    // Stripe ใช้ หน่วยย่อย (สตางค์)
} as const

export function calculateFees(priceTHB: number, isInternational = false) {
  const shipping     = isInternational ? FEES.SHIPPING_INTL : FEES.SHIPPING_THB
  const platformFee  = Math.round(priceTHB * FEES.PLATFORM_RATE)
  const total        = priceTHB + shipping + platformFee
  return { priceTHB, shipping, platformFee, total }
}

// ── Create Stripe Checkout Session ─────────────────────────
export interface CreateCheckoutParams {
  orderId:      string
  orderNumber:  string
  coinTitleTh:  string
  coinImage?:   string
  totalTHB:     number
  buyerEmail:   string
  successUrl:   string
  cancelUrl:    string
}

export async function createStripeCheckout(params: CreateCheckoutParams) {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode:               'payment',
    payment_method_types: ['card'],
    customer_email:     params.buyerEmail,
    line_items: [
      {
        price_data: {
          currency:     'thb',
          unit_amount:  params.totalTHB * FEES.THB_TO_SATANG, // convert to satang
          product_data: {
            name:   params.coinTitleTh,
            images: params.coinImage ? [params.coinImage] : [],
            metadata: { orderId: params.orderId },
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      metadata: {
        orderId:     params.orderId,
        orderNumber: params.orderNumber,
      },
      capture_method: 'automatic',
    },
    metadata: {
      orderId:     params.orderId,
      orderNumber: params.orderNumber,
    },
    success_url: params.successUrl,
    cancel_url:  params.cancelUrl,
  })

  return session
}

// ── Retrieve Stripe Checkout Session ───────────────────────
export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripe()
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  })
}

// ── Create PromptPay Payment Intent ────────────────────────
export interface CreatePromptPayParams {
  orderId:     string
  orderNumber: string
  totalTHB:    number
  buyerEmail:  string
}

export async function createPromptPayIntent(params: CreatePromptPayParams) {
  const stripe = getStripe()

  const paymentIntent = await stripe.paymentIntents.create({
    amount:   params.totalTHB * FEES.THB_TO_SATANG,
    currency: 'thb',
    payment_method_types: ['promptpay'],
    metadata: {
      orderId:     params.orderId,
      orderNumber: params.orderNumber,
    },
    receipt_email: params.buyerEmail,
  })

  // PromptPay QR is in next_action after confirm
  const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
    payment_method: { type: 'promptpay' } as unknown as Stripe.PaymentIntentConfirmParams['payment_method'],
  })

  return confirmed
}

// ── Verify Stripe Webhook ───────────────────────────────────
export function verifyStripeWebhook(
  payload:   string | Buffer,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  return getStripe().webhooks.constructEvent(payload, signature, secret)
}

// ── Create Transfer (payout to seller) ─────────────────────
export async function createSellerPayout(params: {
  stripeAccountId: string
  amountTHB:       number
  orderId:         string
}) {
  const stripe = getStripe()
  // ใช้ Stripe Connect transfers
  return stripe.transfers.create({
    amount:      params.amountTHB * FEES.THB_TO_SATANG,
    currency:    'thb',
    destination: params.stripeAccountId,
    metadata:    { orderId: params.orderId },
  })
}

// ── Issue Refund ────────────────────────────────────────────
export async function refundPayment(params: {
  paymentIntentId: string
  amountTHB?:      number   // undefined = full refund
  reason?:         'duplicate' | 'fraudulent' | 'requested_by_customer'
}) {
  const stripe = getStripe()
  return stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    ...(params.amountTHB && { amount: params.amountTHB * FEES.THB_TO_SATANG }),
    reason: params.reason ?? 'requested_by_customer',
  })
}
