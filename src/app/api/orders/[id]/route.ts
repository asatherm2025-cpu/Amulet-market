import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, unauthorized, forbidden, badRequest, serverError } from '@/lib/api-response'
import { updateOrderSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'
import { CoinStatus, OrderStatus, PaymentStatus } from '@prisma/client'

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        coin: {
          include: {
            certificate: { select: { status: true, issuedAt: true } },
          },
        },
        buyer:       { select: { id: true, name: true, avatarUrl: true, phone: true } },
        seller:      { select: { id: true, name: true, avatarUrl: true, phone: true } },
        review:      true,
        transaction: true,
      },
    })

    if (!order) return notFound('Order not found')
    if (order.buyerId !== user.id && order.sellerId !== user.id && user.role !== 'ADMIN') {
      return forbidden()
    }

    return ok(order)
  } catch (e) {
    return serverError(e)
  }
}

// PATCH /api/orders/[id] — Update order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: { coin: true },
    })
    if (!order) return notFound('Order not found')

    const isBuyer  = order.buyerId  === user.id
    const isSeller = order.sellerId === user.id
    const isAdmin  = user.role === 'ADMIN'

    if (!isBuyer && !isSeller && !isAdmin) return forbidden()

    const body   = await req.json()
    const parsed = updateOrderSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const { status, trackingNumber, shippingCarrier, notes, disputeReason } = parsed.data

    // Validate state transitions
    if (status === 'SHIPPED' && !isSeller && !isAdmin) return forbidden('Only seller can mark as shipped')
    if (status === 'DELIVERED' && !isBuyer && !isAdmin) return forbidden('Only buyer can confirm delivery')
    if (status === 'CANCELLED' && order.paymentStatus === PaymentStatus.RELEASED) {
      return badRequest('Cannot cancel completed order')
    }

    const updateData: Record<string, unknown> = {
      ...(trackingNumber  && { trackingNumber }),
      ...(shippingCarrier && { shippingCarrier }),
      ...(notes           && { notes }),
      ...(disputeReason   && { disputeReason, status: OrderStatus.DISPUTED }),
    }

    if (status === 'SHIPPED')   { updateData.status = OrderStatus.SHIPPED;   updateData.shippedAt   = new Date() }
    if (status === 'DELIVERED') { updateData.status = OrderStatus.DELIVERED; updateData.deliveredAt = new Date() }
    if (status === 'CANCELLED') {
      updateData.status = OrderStatus.CANCELLED
      // Release coin back to available
      await prisma.coin.update({
        where: { id: order.coinId },
        data:  { status: CoinStatus.AVAILABLE },
      })
    }

    const updated = await prisma.order.update({
      where: { id },
      data:  updateData,
    })

    // Notify other party
    const notifyUserId = isSeller ? order.buyerId : order.sellerId
    await prisma.notification.create({
      data: {
        userId:  notifyUserId,
        type:    'ORDER_UPDATE',
        title:   'อัปเดตสถานะคำสั่งซื้อ',
        message: `คำสั่งซื้อ #${order.orderNumber} อัปเดตสถานะเป็น ${updated.status}`,
        data:    { orderId: id },
      },
    })

    return ok(updated)
  } catch (e) {
    return serverError(e)
  }
}
