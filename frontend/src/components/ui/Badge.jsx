import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-slate-800/80 text-slate-300 border border-slate-700/50',
  indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  red: 'bg-red-500/10 text-red-400 border border-red-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
}

export default function Badge({ children, variant = 'default', className, dot, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-indigo-400': variant === 'indigo',
          'bg-emerald-400': variant === 'emerald',
          'bg-amber-400': variant === 'amber',
          'bg-red-400': variant === 'red' || variant === 'rose',
          'bg-slate-400': variant === 'default',
          'bg-purple-400': variant === 'purple',
          'bg-cyan-400': variant === 'cyan',
          'bg-orange-400': variant === 'orange',
        })} />
      )}
      {children}
    </span>
  )
}
