import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, conflict, serverError } from '@/lib/api-response'
import { createOrderSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'
import { CoinStatus, OrderStatus, PaymentStatus } from '@/lib/prisma-enums'

function generateOrderNumber(): string {
  const ts   = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SC-${ts}-${rand}`
}

// GET /api/orders — My orders (buyer or seller)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { searchParams } = req.nextUrl
    const role   = searchParams.get('role') ?? 'buyer'
    const page   = Number(searchParams.get('page') ?? 1)
    const limit  = Number(searchParams.get('limit') ?? 20)
    const status = searchParams.get('status') as OrderStatus | null
    const skip   = (page - 1) * limit

    const where =
      role === 'seller'
        ? { sellerId: user.id, ...(status && { status }) }
        : { buyerId: user.id,  ...(status && { status }) }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          coin: {
            select: {
              id: true, titleTh: true, titleEn: true,
              images: true, priceTHB: true,
            },
          },
          buyer:  { select: { id: true, name: true, avatarUrl: true } },
          seller: { select: { id: true, name: true, avatarUrl: true } },
          review: { select: { id: true, rating: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return ok(orders, { total, page, limit, hasMore: skip + orders.length < total })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/orders — Create order (initiate purchase)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body   = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const { coinId, shippingAddress, notes } = parsed.data

    // Check coin availability
    const coin = await prisma.coin.findUnique({ where: { id: coinId } })
    if (!coin)                              return badRequest('Coin not found')
    if (coin.status !== CoinStatus.AVAILABLE) return conflict('Coin is not available')
    if (coin.sellerId === user.id)          return badRequest('Cannot buy your own coin')

    // Calculate fees
    const amountTHB      = Number(coin.priceTHB)
    const shippingFeeTHB = 350
    const escrowFeeTHB   = Math.round(amountTHB * 0.03)
    const totalTHB       = amountTHB + shippingFeeTHB + escrowFeeTHB

    // Create order + reserve coin atomically
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          orderNumber:    generateOrderNumber(),
          buyerId:        user.id,
          sellerId:       coin.sellerId,
          coinId,
          amountTHB,
          shippingFeeTHB,
          escrowFeeTHB,
          totalTHB,
          status:         OrderStatus.PENDING_PAYMENT,
          paymentStatus:  PaymentStatus.PENDING,
          shippingAddress,
          notes,
        },
        include: {
          coin:   { select: { id: true, titleTh: true, images: true } },
          seller: { select: { id: true, name: true } },
        },
      }),
      prisma.coin.update({
        where: { id: coinId },
        data:  { status: CoinStatus.RESERVED },
      }),
    ])

    // Notify seller
    await prisma.notification.create({
      data: {
        userId:  coin.sellerId,
        type:    'ORDER_UPDATE',
        title:   'มีคำสั่งซื้อใหม่!',
        message: `${user.name} ต้องการซื้อเหรียญของคุณ`,
        data:    { orderId: order.id },
      },
    })

    return created(order)
  } catch (e) {
    return serverError(e)
  }
}
