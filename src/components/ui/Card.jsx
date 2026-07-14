import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  onClick,
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hoverable ? { y: -4, scale: 1.01, boxShadow: '0 12px 30px -8px rgba(92, 85, 78, 0.15)' } : undefined}
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        bg-surface rounded-2xl border border-border shadow-card
        ${paddings[padding]}
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}
