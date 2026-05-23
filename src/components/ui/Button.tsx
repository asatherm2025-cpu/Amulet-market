import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost' | 'dark' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  gold:    'gold-gradient text-[#1A1208] font-bold shadow hover:opacity-90 active:scale-95',
  outline: 'border-2 border-[#C9A84C] text-[#C9A84C] hover:bg-yellow-50 font-semibold',
  ghost:   'text-gray-600 hover:bg-gray-100 font-medium',
  dark:    'bg-[#1A1208] text-[#F0D080] font-bold hover:bg-[#2D2010]',
  danger:  'bg-red-500 text-white font-bold hover:bg-red-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'gold', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = 'Button'
