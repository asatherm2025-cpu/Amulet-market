import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, unauthorized, badRequest, serverError } from '@/lib/api-response'
import { updateUserSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/users/me
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: {
            coins: true,
            orders: true,
            sales: true,
            reviewsReceived: true,
          },
        },
      },
    })

    return ok(fullUser)
  } catch (e) {
    return serverError(e)
  }
}

// PATCH /api/users/me
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body   = await req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data:  parsed.data,
    })

    return ok(updated)
  } catch (e) {
    return serverError(e)
  }
}
