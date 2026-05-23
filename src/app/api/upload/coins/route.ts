import { NextRequest } from 'next/server'
import { created, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'
import { uploadFile, validateFile, parseFormData, UPLOAD_CONFIG } from '@/lib/storage'

// POST /api/upload/coins — อัปโหลดรูปเหรียญ (สูงสุด 10 รูป)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { files } = await parseFormData(req)

    if (!files.length) return badRequest('ไม่พบไฟล์ที่อัปโหลด')
    if (files.length > UPLOAD_CONFIG.coins.maxFiles) {
      return badRequest(`อัปโหลดได้สูงสุด ${UPLOAD_CONFIG.coins.maxFiles} รูปต่อครั้ง`)
    }

    // Validate all files first
    for (const file of files) {
      const error = validateFile(file, 'coins')
      if (error) return badRequest(error)
    }

    // Upload all in parallel
    const results = await Promise.all(
      files.map(file => uploadFile(file.buffer, 'coins', file.name, file.type))
    )

    return created({
      urls:     results.map(r => r.url),
      thumbs:   results.map(r => r.thumbnailUrl ?? r.url),
      publicIds: results.map(r => r.publicId),
      provider: results[0].provider,
      count:    results.length,
    })
  } catch (e) {
    return serverError(e)
  }
}
