import { NextRequest } from 'next/server'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { uploadFile, validateFile, parseFormData } from '@/lib/storage'
import { prisma } from '@/lib/prisma'

// POST /api/upload/avatar — อัปโหลดรูปโปรไฟล์
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { files } = await parseFormData(req)
    if (!files.length) return badRequest('ไม่พบไฟล์ที่อัปโหลด')

    const file  = files[0]
    const error = validateFile(file, 'avatar')
    if (error) return badRequest(error)

    const result = await uploadFile(file.buffer, 'avatar', file.name, file.type)

    // อัปเดต user record ทันที
    await prisma.user.update({
      where: { id: user.id },
      data:  { avatarUrl: result.url },
    })

    return ok({ url: result.url, publicId: result.publicId, provider: result.provider })
  } catch (e) {
    return serverError(e)
  }
}
