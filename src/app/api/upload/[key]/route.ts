import { NextRequest } from 'next/server'
import { ok, badRequest, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { deleteFile } from '@/lib/storage'
import { z } from 'zod'

const schema = z.object({
  provider: z.enum(['cloudinary', 'supabase']).default('cloudinary'),
})

// DELETE /api/upload/[key] — ลบไฟล์ (owner หรือ admin เท่านั้น)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { key } = await params
    if (!key) return badRequest('key is required')

    // decode public_id (อาจมี slash)
    const publicId = decodeURIComponent(key)

    // ตรวจสอบว่าเป็น owner: public_id ต้องมี user id หรือ admin
    // siam-coin/coins/xxx, siam-coin/avatars/xxx
    const isOwner = publicId.includes(user.id) || user.role === 'ADMIN'
    if (!isOwner) return forbidden('ไม่มีสิทธิ์ลบไฟล์นี้')

    const body   = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    const provider = parsed.success ? parsed.data.provider : 'cloudinary'

    await deleteFile(publicId, provider)

    return ok({ deleted: true, publicId })
  } catch (e) {
    return serverError(e)
  }
}
