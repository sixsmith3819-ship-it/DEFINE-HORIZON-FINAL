'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Home, Users, Settings, LogOut, DollarSign, Package, Bell, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored) setIsCollapsed(JSON.parse(stored))
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/customers', icon: Users, label: 'Customers' },
    { href: '/transactions', icon: DollarSign, label: 'Transactions' },
    { href: '/reports', icon: BarChart2, label: 'Reports' },
    { href: '/products', icon: Package, label: 'Products' },
    { href: '/announcements', icon: Bell, label: 'Announcements' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} relative flex flex-col h-screen transition-all duration-300 flex-shrink-0`}
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Top gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />

      {/* Brand */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-4' : 'px-5'} py-5 border-b`} style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          DH
        </div>
        {!isCollapsed && (
          <div className="ml-3 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">Define Horizon</p>
            <p className="text-xs font-medium" style={{ color: '#6366f1' }}>BMS</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-lg transition hover:bg-white/10 text-slate-400 hover:text-white flex-shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`nav-item w-full ${isCollapsed ? 'justify-center px-2' : ''} hover:text-red-400`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>
      </div>
    </aside>
  )
}
