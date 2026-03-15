import { cn } from '../../lib/utils'

export default function Card({ children, className, hover = false, glow = false, gradient = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border',
        'bg-slate-900/60 backdrop-blur-xl border-slate-700/50',
        hover && 'card-hover cursor-pointer',
        glow && 'shadow-glow-sm hover:shadow-glow',
        gradient && 'bg-card-gradient',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('px-5 pt-5 pb-0', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={cn('text-[0.9375rem] font-semibold text-slate-100', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('mt-0.5 text-xs text-slate-500', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={cn('flex items-center px-5 pb-5 pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export function StatCard({ icon, label, value, trend, trendValue, meta, footer, color = 'indigo', className, loading }) {
  const colorMap = {
    indigo: {
      soft: 'text-indigo-200/80',
      accent: 'via-indigo-300/65',
      icon: 'text-indigo-300',
      glow: 'shadow-[0_0_28px_rgba(99,102,241,0.22)]',
      ring: 'border-indigo-500/50',
      orb: 'from-indigo-500/16',
    },
    purple: {
      soft: 'text-purple-200/80',
      accent: 'via-purple-300/65',
      icon: 'text-purple-300',
      glow: 'shadow-[0_0_28px_rgba(168,85,247,0.2)]',
      ring: 'border-purple-500/45',
      orb: 'from-purple-500/14',
    },
    cyan: {
      soft: 'text-cyan-200/80',
      accent: 'via-cyan-300/65',
      icon: 'text-cyan-300',
      glow: 'shadow-[0_0_28px_rgba(34,211,238,0.2)]',
      ring: 'border-cyan-500/45',
      orb: 'from-cyan-500/14',
    },
    emerald: {
      soft: 'text-emerald-200/80',
      accent: 'via-emerald-300/65',
      icon: 'text-emerald-300',
      glow: 'shadow-[0_0_28px_rgba(16,185,129,0.18)]',
      ring: 'border-emerald-500/45',
      orb: 'from-emerald-500/14',
    },
    amber: {
      soft: 'text-amber-200/80',
      accent: 'via-amber-300/65',
      icon: 'text-amber-300',
      glow: 'shadow-[0_0_28px_rgba(245,158,11,0.18)]',
      ring: 'border-amber-500/45',
      orb: 'from-amber-500/14',
    },
    rose: {
      soft: 'text-rose-200/80',
      accent: 'via-rose-300/65',
      icon: 'text-rose-300',
      glow: 'shadow-[0_0_28px_rgba(244,63,94,0.18)]',
      ring: 'border-rose-500/45',
      orb: 'from-rose-500/14',
    },
  }
  const c = colorMap[color] ?? colorMap.indigo

  if (loading) {
    return (
      <Card className={cn('overflow-hidden border-slate-800/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))] shadow-[0_20px_50px_-30px_rgba(2,6,23,0.92)]', className)}>
        <div className="relative p-5">
          <div className="space-y-3">
            <div className="h-6 w-24 rounded-full shimmer bg-slate-800" />
            <div className="h-10 w-20 rounded-lg shimmer bg-slate-800" />
            <div className="h-4 w-32 rounded-full shimmer bg-slate-800" />
          </div>
          <div className="absolute right-5 top-5 h-12 w-12 rounded-2xl shimmer bg-slate-800" />
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('group overflow-hidden border-slate-800/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))] shadow-[0_24px_60px_-34px_rgba(2,6,23,0.88)] transition-all duration-500 hover:-translate-y-1.5 hover:border-slate-700/90 hover:shadow-[0_30px_72px_-32px_rgba(2,6,23,0.96),0_0_36px_rgba(99,102,241,0.08)]', className)}>
      <div className="relative p-5">
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[inherit] bg-gradient-to-b to-transparent opacity-100 transition-opacity duration-500', c.orb)} />
        <div className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent', c.accent)} />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={cn('inline-flex items-center rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]', c.soft)}>
              {label}
            </div>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-100 tabular-nums">{value}</p>
            {(meta ?? trendValue) !== undefined && (
              <p className={cn('mt-2 text-sm', meta ? 'text-slate-500' : trend === 'up' ? 'text-emerald-400' : 'text-red-400')}>
                {!meta && trendValue !== undefined ? `${trend === 'down' ? '↓' : '↑'} ${trendValue}` : meta}
              </p>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border bg-slate-950/90 ring-1 ring-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-500 group-hover:scale-[1.03]', c.icon, c.ring, c.glow)}>
            <span>{icon}</span>
          </div>
        </div>
        {footer && <div className="mt-4">{footer}</div>}
        <div className={cn('mt-5 h-1 w-full rounded-full bg-gradient-to-r from-transparent to-transparent shadow-[0_0_18px_rgba(255,255,255,0.06)]', c.accent)} />
      </div>
    </Card>
  )
}
