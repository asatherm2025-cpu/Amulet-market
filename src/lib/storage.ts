// ============================================================
// SIAM COIN — StorageService
// Cloudinary primary + Supabase Storage fallback
// ============================================================

import { v2 as cloudinary } from 'cloudinary'

// ── Config ──────────────────────────────────────────────────
function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  })
  return cloudinary
}

const isCloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET &&
     process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)

// ── Upload presets per type ──────────────────────────────────
export const UPLOAD_CONFIG = {
  coins: {
    folder:      'siam-coin/coins',
    maxSizeMB:   10,
    maxFiles:    10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
    ],
    thumbnailTransformation: [
      { width: 400, height: 400, crop: 'fill', quality: 'auto:eco' },
    ],
  },
  avatar: {
    folder:      'siam-coin/avatars',
    maxSizeMB:   5,
    maxFiles:    1,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
    ],
  },
  certs: {
    folder:      'siam-coin/certificates',
    maxSizeMB:   20,
    maxFiles:    1,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    transformation: [
      { width: 2000, crop: 'limit', quality: 'auto:good' },
    ],
  },
} as const

export type UploadType = keyof typeof UPLOAD_CONFIG

// ── Upload result ────────────────────────────────────────────
export interface UploadResult {
  url:          string
  thumbnailUrl?: string
  publicId:     string
  width?:       number
  height?:      number
  format:       string
  bytes:        number
  provider:     'cloudinary' | 'supabase'
}

// ── Validate file ────────────────────────────────────────────
export function validateFile(
  file: { type: string; size: number; name: string },
  uploadType: UploadType,
): string | null {
  const config = UPLOAD_CONFIG[uploadType]
  const maxBytes = config.maxSizeMB * 1024 * 1024

  if (!config.allowedTypes.includes(file.type as never)) {
    return `ประเภทไฟล์ไม่รองรับ: ${file.type}. รองรับ: ${config.allowedTypes.join(', ')}`
  }
  if (file.size > maxBytes) {
    return `ไฟล์ใหญ่เกินไป: ${(file.size / 1024 / 1024).toFixed(1)}MB. สูงสุด: ${config.maxSizeMB}MB`
  }
  return null
}

// ── Upload to Cloudinary ─────────────────────────────────────
export async function uploadToCloudinary(
  buffer:      Buffer,
  uploadType:  UploadType,
  fileName?:   string,
): Promise<UploadResult> {
  const cld    = getCloudinary()
  const config = UPLOAD_CONFIG[uploadType]

  // Upload main image
  const result = await new Promise<{ secure_url: string; public_id: string; width: number; height: number; format: string; bytes: number }>(
    (resolve, reject) => {
      const stream = cld.uploader.upload_stream(
        {
          folder:         config.folder,
          transformation: [...config.transformation] as object[],
          resource_type:  'auto',
          use_filename:   false,
          unique_filename: true,
          overwrite:      false,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve(result as { secure_url: string; public_id: string; width: number; height: number; format: string; bytes: number })
        }
      )
      stream.end(buffer)
    }
  )

  // Generate thumbnail for coins
  let thumbnailUrl: string | undefined
  if (uploadType === 'coins' && 'thumbnailTransformation' in config) {
    thumbnailUrl = cld.url(result.public_id, {
      transformation: [...(config as typeof UPLOAD_CONFIG.coins).thumbnailTransformation] as object[],
      secure: true,
    })
  }

  return {
    url:          result.secure_url,
    thumbnailUrl,
    publicId:     result.public_id,
    width:        result.width,
    height:       result.height,
    format:       result.format,
    bytes:        result.bytes,
    provider:     'cloudinary',
  }
}

// ── Upload to Supabase Storage (fallback) ────────────────────
export async function uploadToSupabase(
  buffer:     Buffer,
  uploadType: UploadType,
  fileName:   string,
  mimeType:   string,
): Promise<UploadResult> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const config   = UPLOAD_CONFIG[uploadType]
  const ext      = fileName.split('.').pop() ?? 'jpg'
  const path     = `${config.folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const bucket   = 'siam-coin-uploads'

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false })

  if (error) throw new Error(`Supabase upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return {
    url:      publicUrl,
    publicId: path,
    format:   ext,
    bytes:    buffer.length,
    provider: 'supabase',
  }
}

// ── Main upload function ─────────────────────────────────────
export async function uploadFile(
  buffer:     Buffer,
  uploadType: UploadType,
  fileName:   string,
  mimeType:   string,
): Promise<UploadResult> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, uploadType, fileName)
  }
  return uploadToSupabase(buffer, uploadType, fileName, mimeType)
}

// ── Delete file ──────────────────────────────────────────────
export async function deleteFile(
  publicId:  string,
  provider?: 'cloudinary' | 'supabase',
): Promise<void> {
  const prov = provider ?? (isCloudinaryConfigured() ? 'cloudinary' : 'supabase')

  if (prov === 'cloudinary') {
    const cld = getCloudinary()
    await cld.uploader.destroy(publicId)
  } else {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    await supabase.storage.from('siam-coin-uploads').remove([publicId])
  }
}

// ── Parse multipart form data (Next.js App Router) ──────────
export async function parseFormData(req: Request): Promise<{
  files: Array<{ buffer: Buffer; name: string; type: string; size: number }>
  fields: Record<string, string>
}> {
  const formData = await req.formData()
  const files: Array<{ buffer: Buffer; name: string; type: string; size: number }> = []
  const fields: Record<string, string> = {}

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buffer = Buffer.from(await value.arrayBuffer())
      files.push({
        buffer,
        name: value.name,
        type: value.type,
        size: value.size,
      })
    } else {
      fields[key] = value
    }
  }

  return { files, fields }
}
