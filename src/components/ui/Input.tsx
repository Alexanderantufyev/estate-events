import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  label?: string
  error?: string
  prefix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'input-base',
              prefix && 'pl-8',
              error && 'border-red-500 focus:ring-red-500/50',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
