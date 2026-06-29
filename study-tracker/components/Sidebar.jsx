'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, CheckSquare, TrendingUp, Users, X, Menu } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Study Area',  icon: BookOpen,    href: '/child' },
  { label: 'Tasks',       icon: CheckSquare, href: '/child/Task' },
  { label: 'Growth',      icon: TrendingUp,  href: '/child/Growth' },
  { label: 'Connection',  icon: Users,       href: '/child/Connections' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <>
      {/* Trigger button — render this wherever you need the hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-[#8B1A4A]">Basira</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href
            return (
              <button
                key={item.label}
                onClick={() => { router.push(item.href); setOpen(false) }}
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

        {/* Family Connect */}
        <div className="mx-3 mb-5 rounded-2xl bg-pink-50 border border-pink-100 p-4">
          <p className="text-xs font-semibold text-[#8B1A4A] uppercase mb-1">
            Family Connect
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Your parent can watch your session live.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#8B1A4A] text-white flex items-center justify-center text-xs font-bold">
              M
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Mom</p>
              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Online
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-full bg-[#8B1A4A] hover:bg-[#C4526A] text-white text-xs font-bold py-2 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  )
}