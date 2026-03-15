import { Children, forwardRef, isValidElement, useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, ChevronDown, ListFilter, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

const Input = forwardRef(function Input(
  { label, error, hint, leftIcon, rightIcon, className, type = 'text', ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative transition-all duration-300',
          isFocused && 'scale-[1.01]'
        )}
      >
        {leftIcon && (
          <span
            className={cn(
              'absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300',
              isFocused ? 'text-indigo-300 scale-110 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]' : 'text-slate-500'
            )}
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={inputType}
          onFocus={(e) => {
            setIsFocused(true)
            if (props.onFocus) props.onFocus(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            if (props.onBlur) props.onBlur(e)
          }}
          className={cn(
            'w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5',
            'text-sm text-slate-100 placeholder:text-slate-600',
            'transition-all duration-300 outline-none',
            'focus:border-[color:var(--accent-border-strong)] focus:ring-2 focus:ring-[color:var(--accent-ring)] focus:bg-slate-900/95 focus:shadow-[0_0_0_1px_var(--accent-border),0_0_22px_var(--accent-shadow)]',
            leftIcon && 'pl-10',
            (rightIcon || isPassword) && 'pr-10',
            error && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/15',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className={cn(
              'absolute right-3.5 top-1/2 -translate-y-1/2 transition-all duration-200',
              showPassword ? 'text-indigo-300 scale-110 rotate-6' : 'text-slate-500 hover:text-slate-300'
            )}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <span className={cn('inline-flex transition-transform duration-200', showPassword ? 'rotate-180' : 'rotate-0')}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </span>
          </button>
        )}
        {rightIcon && !isPassword && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export default Input

export function Textarea({ label, error, hint, className, ...props }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <textarea
        className={cn(
          'w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5',
          'text-sm text-slate-100 placeholder:text-slate-600',
          'transition-all duration-200 outline-none resize-none',
          'focus:border-[color:var(--accent-border-strong)] focus:ring-2 focus:ring-[color:var(--accent-ring)]',
          error && 'border-red-500/60',
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Select({ label, error, hint, className, children, leftIcon, optionIcons, ...props }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const fieldIcon = leftIcon ?? <ListFilter size={15} />

  const options = useMemo(() => {
    return Children.toArray(children)
      .filter((child) => isValidElement(child) && child.type === 'option')
      .map((child) => ({
        value: child.props.value ?? '',
        label: child.props.children,
        disabled: Boolean(child.props.disabled),
      }))
  }, [children])

  const selected = options.find((opt) => String(opt.value) === String(props.value))
  const selectedLabel = selected?.label ?? options[0]?.label ?? 'Select option'
  const selectedIcon = optionIcons?.[String(selected?.value ?? '')]

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const commitValue = (value) => {
    if (typeof props.onChange === 'function') {
      props.onChange({ target: { value, name: props.name } })
    }
    setOpen(false)
  }

  const hasMeta = Boolean(label || error || hint)

  return (
    <div className={cn(hasMeta && 'space-y-1.5', className)} ref={rootRef}>
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative group">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-200 group-focus-within:text-cyan-300 group-focus-within:drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]">
          {fieldIcon}
        </span>

        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={props.disabled}
          onClick={() => !props.disabled && setOpen((v) => !v)}
          className={cn(
            'w-full rounded-xl border px-10 py-2.5 pr-10 text-left',
            'border-slate-700/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.9))]',
            'text-sm text-slate-100',
            'transition-all duration-200 outline-none cursor-pointer',
            'focus:border-[color:var(--accent-border-strong)] focus:ring-2 focus:ring-[color:var(--accent-ring)] focus:shadow-[0_0_0_1px_var(--accent-border),0_0_20px_var(--accent-shadow)]',
            props.disabled && 'cursor-not-allowed opacity-60',
            error && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20',
          )}
        >
          <span className="flex items-center gap-2.5">
            {selectedIcon && <span className="shrink-0 text-cyan-300">{selectedIcon}</span>}
            <span className="truncate block">{selectedLabel}</span>
          </span>
        </button>

        <ChevronDown
          size={15}
          className={cn(
            'pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-200',
            open ? 'rotate-180 text-cyan-300' : 'rotate-0'
            
          )}
        />

        {open && !props.disabled && (
          <div className="absolute top-full left-0 z-[120] mt-1 w-full overflow-hidden rounded-xl border border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] shadow-[0_16px_42px_rgba(0,0,0,0.45)]">
            <ul role="listbox" className="max-h-64 overflow-auto p-1.5">
              {options.map((option) => {
                const active = String(option.value) === String(props.value)
                const optionIcon = optionIcons?.[String(option.value)]
                return (
                  <li key={`${option.value}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={option.disabled}
                      onClick={() => commitValue(option.value)}
                      className={cn(
                        'w-full rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-150',
                        option.disabled && 'cursor-not-allowed opacity-45',
                        !option.disabled && (active
                          ? 'bg-[color:var(--accent-soft-bg)] text-slate-100'
                          : 'text-slate-200 hover:bg-slate-800/75 hover:text-white')
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="min-w-0 flex items-center gap-2.5">
                          {optionIcon && <span className={cn('shrink-0', active ? 'text-cyan-300' : 'text-slate-400')}>{optionIcon}</span>}
                          <span className="truncate">{option.label}</span>
                        </span>
                        {active && <Check size={14} className="shrink-0 text-[var(--accent-solid)]" />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
      <input type="hidden" hidden name={props.name} value={props.value ?? ''} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
