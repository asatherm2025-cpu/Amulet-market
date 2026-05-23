import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'green' | 'red' | 'gray' | 'blue'
  className?: string
}

const variants = {
  gold:  'bg-yellow-100 text-yellow-800 border border-yellow-300',
  green: 'bg-green-100 text-green-800 border border-green-300',
  red:   'bg-red-100   text-red-800   border border-red-300',
  gray:  'bg-gray-100  text-gray-700  border border-gray-300',
  blue:  'bg-blue-100  text-blue-800  border border-blue-300',
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
