const variants = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-amber-700',
  error: 'bg-error-light text-error',
  info: 'bg-info-light text-info',
  gray: 'bg-background-alt text-text-secondary',
  verified: 'bg-primary-100 text-primary-700 ring-1 ring-primary-200',
  grade: 'bg-background-alt text-text-primary font-bold',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  )
}
