import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { FraudSeverity } from '@prisma/client'

// GET /api/fraud — List fraud alerts (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const { searchParams } = req.nextUrl
    const page       = Number(searchParams.get('page') ?? 1)
    const limit      = Number(searchParams.get('limit') ?? 20)
    const severity   = searchParams.get('severity') as FraudSeverity | null
    const isResolved = searchParams.get('resolved') === 'true'
    const skip       = (page - 1) * limit

    const where = {
      ...(severity && { severity }),
      isResolved,
    }

    const [alerts, total] = await Promise.all([
      prisma.fraudAlert.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          coin: { select: { id: true, titleTh: true, images: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.fraudAlert.count({ where }),
    ])

    return ok(alerts, { total, page, limit, hasMore: skip + alerts.length < total })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/fraud — Report fraud (any user)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { coinId, userId, type, description, evidence } = await req.json()
    if (!type || !description) return badRequest('type and description are required')

    // Auto-determine severity based on type
    const severityMap: Record<string, FraudSeverity> = {
      fake_cert:           FraudSeverity.CRITICAL,
      counterfeit_coin:    FraudSeverity.HIGH,
      price_manipulation:  FraudSeverity.MEDIUM,
      duplicate_image:     FraudSeverity.MEDIUM,
      suspicious_seller:   FraudSeverity.LOW,
    }

    const alert = await prisma.fraudAlert.create({
      data: {
        coinId,
        userId,
        severity:    severityMap[type] ?? FraudSeverity.LOW,
        type,
        description,
        evidence,
      },
    })

    // Auto-flag coin if severity is HIGH/CRITICAL
    if (coinId && (alert.severity === FraudSeverity.HIGH || alert.severity === FraudSeverity.CRITICAL)) {
      await prisma.coin.update({
        where: { id: coinId },
        data:  { fraudScore: 80, status: 'PENDING_REVIEW' },
      })
    }

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId:  a.id,
        type:    'FRAUD_ALERT' as const,
        title:   `🚨 Fraud Alert: ${alert.severity}`,
        message: `${type}: ${description.substring(0, 100)}`,
        data:    { alertId: alert.id, coinId, userId },
      })),
    })

    return created(alert)
  } catch (e) {
    return serverError(e)
  }
}
