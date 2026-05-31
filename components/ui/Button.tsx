import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'gold', size = 'md', loading, disabled, children, ...props }, ref) => {
    const variants = {
      gold: 'bg-gradient-to-r from-gold-600 to-gold-500 text-dark-950 font-semibold hover:from-gold-500 hover:to-gold-400 shadow-lg hover:shadow-gold-500/25',
      outline: 'border border-gold-600/40 text-gold-400 hover:bg-gold-600/10',
      ghost: 'text-dark-300 hover:text-white hover:bg-dark-800',
      danger: 'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
