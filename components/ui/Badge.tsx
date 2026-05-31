import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'green' | 'red' | 'blue' | 'gray'
}

export function Badge({ className, variant = 'gray', children, ...props }: BadgeProps) {
  const variants = {
    gold: 'bg-gold-500/15 text-gold-400 border-gold-500/30',
    green: 'bg-green-500/15 text-green-400 border-green-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    gray: 'bg-dark-700/50 text-dark-300 border-dark-600',
  }
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}
