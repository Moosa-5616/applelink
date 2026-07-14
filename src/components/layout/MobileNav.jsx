import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, PlusCircle, MessageSquare, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'

const farmerTabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/marketplace', icon: Search, label: 'Market' },
  { path: '/create-listing', icon: PlusCircle, label: 'List' },
  { path: '/offers', icon: MessageSquare, label: 'Offers' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

const buyerTabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/marketplace', icon: Search, label: 'Browse' },
  { path: '/my-offers', icon: MessageSquare, label: 'Offers' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

export default function MobileNav({ role = 'farmer' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const tabs = role === 'buyer' ? buyerTabs : farmerTabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border-light sm:hidden">
      <div className="flex items-center justify-around h-16 px-2 max-w-[480px] mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          const Icon = tab.icon
          const isCreateBtn = tab.path === '/create-listing'

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`
                relative flex flex-col items-center justify-center gap-0.5
                min-w-[3.5rem] py-1.5 rounded-xl transition-colors cursor-pointer
                ${isCreateBtn
                  ? ''
                  : isActive
                    ? 'text-primary-600'
                    : 'text-text-muted hover:text-text-secondary'
                }
              `}
            >
              {isCreateBtn ? (
                <div className="w-11 h-11 -mt-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-elevated">
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
              ) : (
                <>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -top-0.5 w-5 h-0.5 bg-primary-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
              <span className={`text-[10px] font-medium ${isCreateBtn ? 'text-primary-600 font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Safe area bottom padding for iPhone notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
