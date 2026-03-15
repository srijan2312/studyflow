import { cn } from '../../lib/utils'

const colorMap = {
  indigo: 'from-indigo-500 to-purple-600',
  cyan: 'from-cyan-500 to-blue-600',
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-pink-600',
  purple: 'from-purple-500 to-indigo-600',
}

export default function Progress({
  value = 0,
  max = 100,
  color = 'indigo',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const gradient = colorMap[color] ?? colorMap.indigo

  const heights = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  }

  return (
    <div className={cn('space-y-1', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-slate-500">{label}</span>}
          {showLabel && (
            <span className="text-xs font-semibold text-slate-300 tabular-nums">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-slate-800/80 overflow-hidden', heights[size] ?? heights.md)}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
            gradient,
            pct > 0 && 'shadow-[0_0_8px_rgba(99,102,241,0.5)]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** Circular progress ring */
export function CircularProgress({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = '#6366f1',
  trackColor = 'rgba(148,163,184,0.1)',
  children,
  className,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
