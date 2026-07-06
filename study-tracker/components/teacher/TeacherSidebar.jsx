'use client'

import { LayoutDashboard, ClipboardList, BookOpen, Users, X } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard },
  { label: 'Assignments', icon: ClipboardList },
  { label: 'Curriculum',  icon: BookOpen },
  { label: 'Students',    icon: Users },
]

function getInitials(name) {
  return (name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function TeacherSidebar({ profile, activeNav, onNavChange, open, onClose }) {
  const teacherName = profile?.display_name ?? profile?.full_name ?? 'Teacher'
  const initials    = getInitials(teacherName)

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <span className="text-lg font-bold text-[#8B1A4A]">Basira</span>
        <button
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
          <p className="text-sm font-bold text-[#8B1A4A]">{teacherName}</p>
          <p className="text-xs text-gray-400">Lead Educator</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => {
              onNavChange(item.label)
              onClose?.()
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              activeNav === item.label
                ? 'bg-pink-50 text-[#8B1A4A]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
