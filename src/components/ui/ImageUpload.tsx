'use client'
import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  uploadType: 'coins' | 'avatar' | 'certs'
  value?: string[]
  onChange?: (urls: string[]) => void
  maxFiles?: number
  className?: string
  label?: string
  disabled?: boolean
}

export function ImageUpload({
  uploadType,
  value = [],
  onChange,
  maxFiles = uploadType === 'coins' ? 10 : 1,
  className,
  label,
  disabled,
}: ImageUploadProps) {
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [dragOver, setDragOver]     = useState(false)
  const inputRef                    = useRef<HTMLInputElement>(null)

  const endpoint = `/api/upload/${uploadType}`

  const upload = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    if (!fileArr.length) return

    const remaining = maxFiles - value.length
    if (remaining <= 0) {
      setError(`อัปโหลดได้สูงสุด ${maxFiles} รูป`)
      return
    }
    const toUpload = fileArr.slice(0, remaining)

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      toUpload.forEach(f => formData.append('file', f))

      const res  = await fetch(endpoint, { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'อัปโหลดล้มเหลว')
      }

      const newUrls: string[] = json.data?.urls ?? [json.data?.url]
      onChange?.([...value, ...newUrls.filter(Boolean)])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดล้มเหลว')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [endpoint, value, onChange, maxFiles])

  const removeImage = (url: string) => onChange?.(value.filter(u => u !== url))

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!disabled) upload(e.dataTransfer.files)
  }, [disabled, upload])

  const accept = uploadType === 'certs'
    ? 'image/jpeg,image/png,image/webp,application/pdf'
    : 'image/jpeg,image/png,image/webp'

  const isFull = value.length >= maxFiles

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-xs font-bold text-gray-600">{label}</label>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div
              key={url}
              className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-yellow-200 bg-yellow-50"
            >
              <Image
                src={url}
                alt={`upload-${i}`}
                fill
                className="object-cover"
                sizes="80px"
              />
              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X size={11} />
                </button>
              )}
              {/* Order badge */}
              <div className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {!isFull && !disabled && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2',
            'rounded-2xl border-2 border-dashed cursor-pointer transition-all',
            'min-h-[120px] px-4 py-6',
            dragOver
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-yellow-300 bg-yellow-50/50 hover:border-yellow-400 hover:bg-yellow-50',
            uploading && 'pointer-events-none opacity-70',
          )}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="text-yellow-500 animate-spin" />
              <p className="text-sm text-gray-500">กำลังอัปโหลด...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                {value.length > 0 ? (
                  <ImageIcon size={22} className="text-yellow-600" />
                ) : (
                  <Upload size={22} className="text-yellow-600" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {dragOver ? 'วางไฟล์ที่นี่' : 'คลิกหรือลากไฟล์มาวาง'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {uploadType === 'certs'
                    ? 'JPG, PNG, PDF สูงสุด 20MB'
                    : `JPG, PNG, WebP สูงสุด ${uploadType === 'coins' ? '10' : '5'}MB`}
                </p>
                {maxFiles > 1 && (
                  <p className="text-xs text-yellow-600 mt-1 font-medium">
                    {value.length}/{maxFiles} รูป
                  </p>
                )}
              </div>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            className="hidden"
            onChange={e => e.target.files && upload(e.target.files)}
          />
        </div>
      )}

      {/* Full indicator */}
      {isFull && !disabled && (
        <p className="text-xs text-center text-yellow-700 font-medium py-2">
          ✅ อัปโหลดครบ {maxFiles} รูปแล้ว — ลบรูปเดิมก่อนเพื่อเพิ่มใหม่
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle size={15} className="shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
