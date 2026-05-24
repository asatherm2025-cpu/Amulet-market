import { NextRequest } from 'next/server'
import { created, badRequest, unauthorized, forbidden, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { uploadFile, validateFile, parseFormData } from '@/lib/storage'

// POST /api/upload/certs — อัปโหลดรูปใบรับรอง (expert/admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (user.role !== 'EXPERT' && user.role !== 'ADMIN') {
      return forbidden('เฉพาะ Expert หรือ Admin เท่านั้น')
    }

    const { files } = await parseFormData(req)
    if (!files.length) return badRequest('ไม่พบไฟล์ที่อัปโหลด')

    const file  = files[0]
    const error = validateFile(file, 'certs')
    if (error) return badRequest(error)

    const result = await uploadFile(file.buffer, 'certs', file.name, file.type)

    return created({ url: result.url, publicId: result.publicId, provider: result.provider })
  } catch (e) {
    return serverError(e)
  }
}
