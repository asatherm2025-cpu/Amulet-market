import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(thb: number): { thb: string; usd: string; cny: string } {
  return {
    thb: new Intl.NumberFormat('th-TH').format(thb),
    usd: new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(thb / 37),
    cny: new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(thb / 5.1),
  }
}

export function conditionLabel(score: number): { th: string; en: string; stars: number } {
  const map: Record<number, { th: string; en: string; stars: number }> = {
    5: { th: 'สภาพเยี่ยม', en: 'Mint', stars: 5 },
    4: { th: 'สภาพดีมาก', en: 'Very Good', stars: 4 },
    3: { th: 'สภาพดี', en: 'Good', stars: 3 },
    2: { th: 'สภาพพอใช้', en: 'Fair', stars: 2 },
    1: { th: 'สภาพคงเดิม', en: 'Worn', stars: 1 },
  }
  return map[score] ?? map[3]
}
