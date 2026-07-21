import { useState, useEffect } from 'react'
import { Bell, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getNotifications } from '../../lib/database'

export default function Header({ user }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    const checkUnread = async () => {
      if (!profile?.id) return
      try {
        const { data } = await getNotifications(profile.id)
        if (data) {
          setHasUnread(data.some(n => !n.is_read))
        }
      } catch (err) {
        // Silently fail — notification dot is non-critical
      }
    }

    checkUnread()
    // Re-check every 30 seconds
    const interval = setInterval(checkUnread, 30000)
    return () => clearInterval(interval)
  }, [profile?.id])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-border-light">
      <div className="max-w-[1024px] mx-auto h-14 px-4 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">🍎</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-text-primary leading-tight tracking-tight">
              Apple<span className="text-primary-600">Link</span>
            </span>
            <span className="text-[9px] font-medium text-text-muted leading-none -mt-0.5">
              Farm to Business
            </span>
          </div>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Notification bell */}
          <button
            onClick={() => {
              setHasUnread(false)
              navigate('/notifications')
            }}
            className="relative p-2 rounded-xl hover:bg-background-alt transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            {/* Notification dot — only shown when there are unread notifications */}
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface" />
            )}
          </button>

          {/* Profile */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-xl hover:bg-background-alt transition-colors cursor-pointer"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-text-secondary" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
