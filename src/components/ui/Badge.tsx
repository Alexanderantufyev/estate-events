import { cn } from '../../utils/cn'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  dot?: boolean
  dotColor?: string
}

export function Badge({ children, className, dot, dotColor }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColor)} />
      )}
      {children}
    </span>
  )
}
