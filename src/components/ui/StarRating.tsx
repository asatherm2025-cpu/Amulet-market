import { cn } from '@/lib/utils'

export function StarRating({ score, max = 5, size = 'md' }: { score: number; max?: number; size?: 'sm' | 'md' }) {
  const sizes = { sm: 'text-xs', md: 'text-sm' }
  return (
    <span className={cn('inline-flex gap-0.5', sizes[size])}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < score ? 'text-yellow-500' : 'text-gray-300'}>★</span>
      ))}
    </span>
  )
}
