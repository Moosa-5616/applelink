import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  error,
  required = false,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)

  // Filter options based on search term
  const filteredOptions = options.filter(opt => {
    const text = typeof opt === 'string' ? opt : opt.label
    return text.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const selectedLabel = (() => {
    if (!value) return ''
    const opt = options.find(o => (typeof o === 'string' ? o === value : o.value === value))
    return opt ? (typeof opt === 'string' ? opt : opt.label) : value
  })()

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Main Select Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-left
            transition-all duration-150 outline-none pr-10 flex items-center justify-between
            ${error
              ? 'border-error ring-2 ring-error/20'
              : isOpen
                ? 'border-primary-500 ring-2 ring-primary-500/20'
                : 'border-border hover:border-text-muted'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-background-alt' : 'cursor-pointer'}
            ${!selectedLabel ? 'text-text-muted' : 'text-text-primary'}
          `}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform duration-200
              ${isOpen ? 'text-primary-600 rotate-180' : 'text-text-muted'}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Search Input */}
            <div className="p-2 border-b border-border bg-surface sticky top-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background-alt border border-transparent focus:border-primary-500 focus:bg-surface rounded-lg text-sm outline-none transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const val = typeof opt === 'string' ? opt : opt.value
                  const lbl = typeof opt === 'string' ? opt : opt.label
                  return (
                    <button
                      key={`${val}-${idx}`}
                      type="button"
                      onClick={() => {
                        onChange({ target: { value: val } })
                        setIsOpen(false)
                        setSearchTerm('')
                      }}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors
                        ${value === val ? 'bg-primary-50 text-primary-700 font-medium' : 'text-text-primary hover:bg-background-alt'}
                      `}
                    >
                      {lbl}
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-3 text-sm text-text-muted text-center">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
