import {
  BookOpen,
  CheckSquare,
  TrendingUp,
  Users,
  Home,
} from 'lucide-react'

export const STUDENT_NAV = [
  { label: 'Study Area', icon: BookOpen,    href: '/child' },
  { label: 'Tasks',      icon: CheckSquare, href: '/child/Task' },
  { label: 'Growth',     icon: TrendingUp,  href: '/child/Growth' },
  { label: 'Connection', icon: Users,       href: '/child/Connections' },
]

/** Only implemented parent route */
export const PARENT_NAV = [
  { label: 'Family', icon: Home, href: '/parent' },
]

/** Teacher dashboard is a single page — no extra nav items */
export const TEACHER_NAV = []

export function getInitials(name) {
  return (name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
