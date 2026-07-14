import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

export default function TrustScore({ score = 0, size = 'md', showLabel = true }) {
  const radius = size === 'sm' ? 28 : size === 'md' ? 36 : 44
  const strokeWidth = size === 'sm' ? 3 : 4
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const offset = circumference - progress

  const svgSize = (radius + strokeWidth) * 2
  const center = radius + strokeWidth

  const getColor = (score) => {
    if (score >= 80) return { stroke: '#16a34a', text: 'text-primary-700', bg: 'bg-primary-50' }
    if (score >= 60) return { stroke: '#f59e0b', text: 'text-amber-700', bg: 'bg-warning-light' }
    return { stroke: '#ef4444', text: 'text-error', bg: 'bg-error-light' }
  }

  const color = getColor(score)
  const fontSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        {/* Score number */}
        <div className={`absolute inset-0 flex items-center justify-center ${fontSize} font-bold ${color.text}`}>
          {score}
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <ShieldCheck className={`w-3.5 h-3.5 ${color.text}`} />
            <span className={`text-xs font-semibold ${color.text}`}>Trust Score</span>
          </div>
          <span className="text-xs text-text-muted">{score}/100</span>
        </div>
      )}
    </div>
  )
}
