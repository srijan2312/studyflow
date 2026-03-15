import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-[linear-gradient(135deg,var(--accent-solid),var(--accent-strong))] text-white shadow-[0_0_20px_var(--accent-shadow)] hover:shadow-[0_0_28px_var(--accent-shadow)] hover:-translate-y-0.5',
  secondary: 'bg-white/[0.06] text-slate-200 border border-white/10 hover:bg-white/[0.1] hover:border-white/20',
  ghost: 'bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-200',
  danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5',
  success: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5',
  outline: 'bg-transparent text-[var(--accent-solid)] border border-[color:var(--accent-border)] hover:bg-[color:var(--accent-soft-bg)] hover:border-[color:var(--accent-solid)]',
}

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs rounded-lg',
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
  xl: 'px-6 py-3.5 text-base rounded-2xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  leftIcon,
  rightIcon,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer select-none active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border-strong)]',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}
