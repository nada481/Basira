'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Home, BarChart2, Users, UserPlus } from 'lucide-react'
import ChildCard from '@/components/ChildCard'
import {
  getLinkedChildren,
  getChildTodayTime,
  getChildEffortLevel,
  linkChildByEmail,
} from '@/services/parentService'

const NAV_ITEMS = [
  { label: 'Home',     icon: Home },
  { label: 'Progress', icon: BarChart2 },
  { label: 'Connections',   icon: Users , href: '/parent/[parentID]'},
]

export default function ParentFamilyPage({ params }) {
  const { parentId } = params
  const router = useRouter()

  const [menuOpen, setMenuOpen]     = useState(false)
  const [activeNav, setActiveNav]   = useState('Connections')
  const [parent, setParent]         = useState(null)
  const [children, setChildren]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [linkEmail, setLinkEmail]   = useState('')
  const [linking, setLinking]       = useState(false)
  const [linkError, setLinkError]   = useState(null)
  const [linkSuccess, setLinkSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [profRes, kids] = await Promise.all([
          fetch('/api/profile', { headers: { 'x-user-id': parentId } }).then(r => r.json()),
          getLinkedChildren(parentId),
        ])

        const enriched = await Promise.all(
          kids.map(async (child) => {
            const [todaySeconds, effortLevel] = await Promise.all([
              getChildTodayTime(child.id),
              getChildEffortLevel(child.id),
            ])
            return { ...child, todaySeconds, effortLevel }
          })
        )

        setParent(profRes.profile)
        setChildren(enriched)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [parentId])

  async function handleLinkStudent() {
    if (!linkEmail.trim()) return
    setLinking(true)
    setLinkError(null)
    setLinkSuccess(false)

    try {
      const newChild = await linkChildByEmail(parentId, linkEmail.trim())

      const [todaySeconds, effortLevel] = await Promise.all([
        getChildTodayTime(newChild.id),
        getChildEffortLevel(newChild.id),
      ])
      setChildren(prev => [...prev, { ...newChild, todaySeconds, effortLevel }])
      setLinkEmail('')
      setLinkSuccess(true)
      setTimeout(() => setLinkSuccess(false), 3000)
    } catch (err) {
      setLinkError(err.message)
    } finally {
      setLinking(false)
    }
  }

  const parentName     = parent?.display_name ?? parent?.full_name ?? 'Parent'
  const parentInitials = parentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 h-full w-56 bg-white border-r border-gray-100 z-50
        flex flex-col transition-transform duration-300
        ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8B1A4A] text-white text-sm font-bold flex items-center justify-center">
              {parentInitials}
            </div>
            <div>
              <p className="text-sm font-bold text-[#8B1A4A]">{parentName}</p>
              <p className="text-xs text-gray-400">Parent</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => { setActiveNav(item.label); setMenuOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === item.label ? 'bg-[#8B1A4A] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={() => setMenuOpen(false)} className="lg:hidden absolute top-4 right-4 p-1.5 text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </aside>

      <main className="flex-1 px-6 py-8 flex flex-col gap-6">

        <button onClick={() => setMenuOpen(true)} className="lg:hidden self-start p-2 hover:bg-gray-100 rounded-lg text-gray-500 -mt-2">
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-[#8B1A4A]">Family Management</h1>
          <p className="text-xs text-gray-400 mt-1 max-w-md">
            Overview of your linked children's academic progress. Monitor real-time activities and manage learning paths from a single sanctuary.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="flex flex-wrap gap-4">

            {children.map(child => (
              <ChildCard key={child.id} child={child} />
            ))}

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 min-w-[220px] max-w-[260px]">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#8B1A4A]" />
                </div>
                <p className="text-sm font-bold text-gray-800">Link New Account</p>
                <p className="text-xs text-gray-400">
                  Connect another child's student profile using their registered email address.
                </p>
              </div>

              <input
                type="email"
                value={linkEmail}
                onChange={e => { setLinkEmail(e.target.value); setLinkError(null) }}
                placeholder="Enter Email Address"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
              />

              {linkError && <p className="text-xs text-red-500 -mt-2">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-green-500 -mt-2">Student linked successfully!</p>}

              <button
                onClick={handleLinkStudent}
                disabled={linking || !linkEmail.trim()}
                className="w-full bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                {linking ? 'Linking...' : 'Link Student'}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}