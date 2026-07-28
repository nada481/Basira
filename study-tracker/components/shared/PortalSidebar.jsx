'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { getInitials } from '@/lib/portalNav'

export function MenuButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors ${className}`}
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}

export default function PortalSidebar({
  open,
  onClose,
  navItems = [],
  profileName = 'User',
  profileRole = '',
}) {
  const router   = useRouter()
  const pathname = usePathname()
  const initials = getInitials(profileName)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-400/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-[#8B1A4A]">Basira</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 py-6 px-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-[#8B1A4A] text-white font-bold flex items-center justify-center text-sm">
            {initials}
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#8B1A4A]">{profileName}</p>
            <p className="text-xs text-gray-400">{profileRole}</p>
          </div>
        </div>

        {navItems.length > 0 && (
          <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
            {navItems.map(item => {
              const active = pathname === item.href
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    router.push(item.href)
                    onClose()
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    active
                      ? 'bg-pink-50 text-[#8B1A4A]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        )}
      </aside>
    </>
  )
}
