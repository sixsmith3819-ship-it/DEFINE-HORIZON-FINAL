'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Home, Users, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored) {
      setIsCollapsed(JSON.parse(stored))
    }
  }, [])

  // Persist sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      // Force redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    { href: '/dashboard/employee', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/employee/transactions', icon: Users, label: 'Transactions' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gray-900 text-white transition-all duration-300 flex flex-col h-screen border-r border-gray-800`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        {!isCollapsed && <h2 className="text-lg font-bold">Horizon</h2>}
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600/20 transition text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">{isLoggingOut ? 'Signing out...' : 'Logout'}</span>}
        </button>
      </div>
    </aside>
  )
}
