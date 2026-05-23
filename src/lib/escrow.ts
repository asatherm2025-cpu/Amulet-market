// ============================================================
// SIAM COIN — EscrowService
// จัดการ lifecycle ของเงินใน escrow
// ============================================================

import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus } from '@/lib/prisma-enums'

// ── Escrow State Machine ────────────────────────────────────
//
//  PENDING → ESCROW_HELD → RELEASED
//                       ↘ REFUNDED
//
// PENDING      : Order สร้างแล้ว รอผู้ซื้อชำระ
// ESCROW_HELD  : ชำระแล้ว เงินค้างใน Stripe — ผู้ขายจัดส่ง
// RELEASED     : ผู้ซื้อยืนยันรับของ เงินโอนให้ผู้ขาย
// REFUNDED     : ยกเลิก/ข้อพิพาท คืนเงินผู้ซื้อ

// ── Mark payment received → hold in escrow ─────────────────
export async function holdEscrow(params: {
  orderId:        string
  stripePaymentId: string
  stripeSessionId?: string
  amountTHB:      number
  provider:       'stripe' | 'promptpay'
  buyerId:        string
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Update order status
    const order = await tx.order.update({
      where: { id: params.orderId },
      data: {
        status:          OrderStatus.PAID,
        paymentStatus:   PaymentStatus.ESCROW_HELD,
        stripePaymentId: params.stripePaymentId,
        stripeSessionId: params.stripeSessionId,
        paidAt:          new Date(),
      },
      include: {
        coin:   { select: { titleTh: true } },
        seller: { select: { id: true, name: true } },
        buyer:  { select: { id: true, name: true } },
      },
    })

    // 2. Record transaction log
    await tx.transaction.create({
      data: {
        orderId:      params.orderId,
        userId:       params.buyerId,
        type:         'payment',
        amountTHB:    params.amountTHB,
        provider:     params.provider,
        providerTxId: params.stripePaymentId,
        status:       'success',
        metadata: {
          action:  'escrow_hold',
          orderId: params.orderId,
        },
      },
    })

    // 3. Notify seller
    await tx.notification.create({
      data: {
        userId:  order.seller.id,
        type:    'ORDER_UPDATE',
        title:   '💰 ได้รับชำระเงินแล้ว!',
        message: `${order.buyer.name} ชำระเงินสำเร็จ รอการจัดส่งสินค้า "${order.coin.titleTh}"`,
        data:    { orderId: params.orderId, action: 'payment_received' },
      },
    })

    return order
  })
}

// ── Release escrow to seller ────────────────────────────────
export async function releaseEscrow(params: {
  orderId:  string
  buyerId:  string
  releasedBy: 'buyer' | 'auto' | 'admin'
}) {
  const order = await prisma.order.findUnique({
    where:   { id: params.orderId },
    include: {
      seller: { select: { id: true, name: true } },
      buyer:  { select: { id: true, name: true } },
      coin:   { select: { titleTh: true } },
    },
  })

  if (!order) throw new Error('Order not found')
  if (order.paymentStatus !== PaymentStatus.ESCROW_HELD) {
    throw new Error(`Cannot release: payment status is ${order.paymentStatus}`)
  }
  if (params.releasedBy === 'buyer' && order.buyerId !== params.buyerId) {
    throw new Error('Forbidden: not the buyer')
  }

  // Calculate seller payout (deduct platform fee)
  const sellerPayout = Number(order.amountTHB) // coin price only (no shipping/fee)

  return prisma.$transaction(async (tx) => {
    // 1. Update order
    const updated = await tx.order.update({
      where: { id: params.orderId },
      data: {
        status:        OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.RELEASED,
        completedAt:   new Date(),
      },
    })

    // 2. Log payout transaction
    await tx.transaction.create({
      data: {
        orderId:   params.orderId,
        userId:    order.seller.id,
        type:      'payout',
        amountTHB: sellerPayout,
        provider:  'stripe',
        status:    'pending', // จะ update หลัง Stripe transfer สำเร็จ
        metadata: {
          action:      'escrow_release',
          releasedBy:  params.releasedBy,
          sellerPayout,
          platformFee: Number(order.escrowFeeTHB),
        },
      },
    })

    // 3. Update seller stats
    await tx.user.update({
      where: { id: order.seller.id },
      data:  { totalSales: { increment: 1 } },
    })

    // 4. Update buyer stats
    await tx.user.update({
      where: { id: order.buyerId },
      data:  { totalPurchases: { increment: 1 } },
    })

    // 5. Notify seller
    await tx.notification.create({
      data: {
        userId:  order.seller.id,
        type:    'ORDER_UPDATE',
        title:   '🎉 ได้รับเงินแล้ว!',
        message: `ผู้ซื้อยืนยันรับสินค้าแล้ว เงิน ฿${sellerPayout.toLocaleString()} กำลังโอนเข้าบัญชีของคุณ`,
        data:    { orderId: params.orderId, action: 'escrow_released', amount: sellerPayout },
      },
    })

    // 6. Notify buyer
    await tx.notification.create({
      data: {
        userId:  order.buyerId,
        type:    'ORDER_UPDATE',
        title:   '✅ คำสั่งซื้อเสร็จสมบูรณ์',
        message: `คำสั่งซื้อ "${order.coin.titleTh}" เสร็จสิ้นแล้ว อย่าลืมให้คะแนนผู้ขาย!`,
        data:    { orderId: params.orderId, action: 'order_completed' },
      },
    })

    return { order: updated, sellerPayout }
  })
}

// ── Refund escrow to buyer ──────────────────────────────────
export async function refundEscrow(params: {
  orderId:    string
  reason:     string
  refundedBy: 'buyer' | 'admin'
  amountTHB?: number // undefined = full refund
}) {
  const order = await prisma.order.findUnique({
    where:   { id: params.orderId },
    include: {
      seller: { select: { id: true } },
      buyer:  { select: { id: true, name: true } },
      coin:   { select: { id: true, titleTh: true } },
    },
  })

  if (!order) throw new Error('Order not found')
  if (order.paymentStatus === PaymentStatus.RELEASED) {
    throw new Error('Cannot refund: payment already released to seller')
  }

  const refundAmount = params.amountTHB ?? Number(order.totalTHB)

  return prisma.$transaction(async (tx) => {
    // 1. Update order
    const updated = await tx.order.update({
      where: { id: params.orderId },
      data: {
        status:        OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
      },
    })

    // 2. Release coin back to available
    await tx.coin.update({
      where: { id: order.coin.id },
      data:  { status: 'AVAILABLE' },
    })

    // 3. Log refund
    await tx.transaction.create({
      data: {
        orderId:   params.orderId,
        userId:    order.buyerId,
        type:      'refund',
        amountTHB: refundAmount,
        provider:  'stripe',
        status:    'pending',
        metadata: {
          action:     'escrow_refund',
          reason:     params.reason,
          refundedBy: params.refundedBy,
        },
      },
    })

    // 4. Notify buyer
    await tx.notification.create({
      data: {
        userId:  order.buyerId,
        type:    'ORDER_UPDATE',
        title:   '↩️ คืนเงินแล้ว',
        message: `คำสั่งซื้อถูกยกเลิก คืนเงิน ฿${refundAmount.toLocaleString()} ภายใน 3-5 วันทำการ`,
        data:    { orderId: params.orderId, action: 'refunded', amount: refundAmount },
      },
    })

    return { order: updated, refundAmount }
  })
}

// ── Auto-release after 7 days (cron job) ───────────────────
export async function autoReleaseExpiredEscrows() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

  const expiredOrders = await prisma.order.findMany({
    where: {
      paymentStatus: PaymentStatus.ESCROW_HELD,
      status:        OrderStatus.DELIVERED,
      deliveredAt:   { lte: cutoff },
    },
    select: { id: true, buyerId: true },
  })

  const results = await Promise.allSettled(
    expiredOrders.map(order =>
      releaseEscrow({
        orderId:    order.id,
        buyerId:    order.buyerId,
        releasedBy: 'auto',
      })
    )
  )

  return {
    processed: expiredOrders.length,
    succeeded: results.filter(r => r.status === 'fulfilled').length,
    failed:    results.filter(r => r.status === 'rejected').length,
  }
}
