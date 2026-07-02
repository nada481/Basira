'use client'

import { LayoutDashboard, ClipboardList, BookOpen, Users } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard },
  { label: 'Assignments', icon: ClipboardList },
  { label: 'Curriculum',  icon: BookOpen },
  { label: 'Students',    icon: Users },
]

function getInitials(name) {
  return (name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function TeacherSidebar({ profile, activeNav, onNavChange }) {
  const teacherName = profile?.display_name ?? profile?.full_name ?? 'Teacher'
  const initials    = getInitials(teacherName)

  return (
    <aside className="w-48 border-r border-gray-100 flex flex-col py-6 px-3 flex-shrink-0">
      <div className="flex flex-col items-center gap-2 mb-8 px-2">
        <div className="w-12 h-12 rounded-full bg-[#8B1A4A] text-white font-bold flex items-center justify-center text-sm">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-[#8B1A4A]">{teacherName}</p>
          <p className="text-[10px] text-gray-400">Lead Educator • Grade 5</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => onNavChange(item.label)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              activeNav === item.label
                ? 'bg-[#8B1A4A] text-white'
                : 'text-gray-500 hover:bg-gray-50'
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