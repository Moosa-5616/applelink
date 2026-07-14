import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, maxStars = 5, size = 'md', showValue = false, interactive = false, onChange }) {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }

  const handleClick = (index) => {
    if (interactive && onChange) {
      onChange(index + 1)
    }
  }

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handleClick(i)}
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} disabled:cursor-default`}
        >
          <Star
            className={`
              ${sizes[size]}
              ${i < Math.floor(rating)
                ? 'fill-warning text-warning'
                : i < rating
                  ? 'fill-warning/50 text-warning'
                  : 'fill-border-light text-border'
              }
              transition-colors duration-150
            `}
          />
        </button>
      ))}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold text-text-primary">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
