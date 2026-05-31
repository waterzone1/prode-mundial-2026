import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  gold?: boolean
}

export function Card({ className, gold, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-dark-900 rounded-xl border border-dark-700/50 p-4',
        gold && 'border-gold-600/30 shadow-lg shadow-gold-500/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  )
}
