import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full rounded-xl border bg-surface px-4 py-2.5 text-sm
            text-text-primary appearance-none cursor-pointer
            transition-all duration-150 outline-none pr-10
            ${error
              ? 'border-error ring-2 ring-error/20'
              : focused
                ? 'border-primary-500 ring-2 ring-primary-500/20'
                : 'border-border hover:border-text-muted'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-background-alt' : ''}
          `}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors
            ${focused ? 'text-primary-600' : 'text-text-muted'}`}
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
