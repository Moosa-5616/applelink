import { useState } from 'react'

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helper,
  icon: Icon,
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
        {Icon && (
          <Icon
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors
              ${focused ? 'text-primary-600' : 'text-text-muted'}`}
          />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full rounded-xl border bg-surface px-4 py-2.5 text-sm
            text-text-primary placeholder:text-text-muted
            transition-all duration-150 outline-none
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-error ring-2 ring-error/20'
              : focused
                ? 'border-primary-500 ring-2 ring-primary-500/20'
                : 'border-border hover:border-text-muted'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-background-alt' : ''}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {helper && !error && <p className="text-xs text-text-muted">{helper}</p>}
    </div>
  )
}
