import { prisma } from '@/lib/prisma'

// แปลง string เป็น URL-safe slug
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\u0E00-\u0E7F]+/g, '-') // Thai chars + spaces → dash
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// สร้าง unique slug สำหรับ coin
export async function generateCoinSlug(titleEn: string, yearCe: number): Promise<string> {
  const base = slugify(`${titleEn}-${yearCe}`)
  let slug = base
  let counter = 1

  while (true) {
    const existing = await prisma.coin.findUnique({ where: { slug } })
    if (!existing) break
    slug = `${base}-${counter++}`
  }

  return slug
}
