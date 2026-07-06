'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Home, Users, UserPlus } from 'lucide-react'
import ChildCard from '@/components/ChildCard'

export default function ParentFamilyPage({ params }) {
  const { parentId } = use(params)

  const router = useRouter()

  const [menuOpen, setMenuOpen]       = useState(false)
  const [activeNav, setActiveNav]     = useState('Connections')
  const [parent, setParent]           = useState(null)
  const [children, setChildren]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [linkEmail, setLinkEmail]     = useState('')
  const [linking, setLinking]         = useState(false)
  const [linkError, setLinkError]     = useState(null)
  const [linkSuccess, setLinkSuccess] = useState(false)

  const NAV_ITEMS = [
    { label: 'Home',        icon: Home,  href: `/parent/${parentId}` },
    { label: 'Connections', icon: Users, href: `/parent/Connections/${parentId}` },
  ]

  async function loadChildren() {
    try {
      const [profRes, conRes] = await Promise.all([
        fetch('/api/profile', { headers: { 'x-user-id': parentId } }).then(r => r.json()),
        fetch('/api/parent/connections', { headers: { 'x-user-id': parentId } }).then(r => r.json()),
      ])
      setParent(profRes.profile)
      setChildren(conRes.children ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadChildren() }, [parentId])

  async function handleLinkStudent() {
    if (!linkEmail.trim()) return
    setLinking(true)
    setLinkError(null)
    setLinkSuccess(false)

    try {
      const res = await fetch('/api/parent/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': parentId },
        body: JSON.stringify({ email: linkEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to link student')

      setLinkEmail('')
      setLinkSuccess(true)
      setTimeout(() => setLinkSuccess(false), 3000)
      await loadChildren()
    } catch (err) {
      setLinkError(err.message)
    } finally {
      setLinking(false)
    }
  }

  const parentName     = parent?.display_name ?? parent?.full_name ?? 'Parent'
  const parentInitials = parentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <main className="min-h-screen bg-gray-50">

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-[#8B1A4A]">Basira</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
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
              onClick={() => {
                router.push(item.href)
                setActiveNav(item.label)
                setMenuOpen(false)
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

      <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white">
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[#8B1A4A]">Family Management</h1>
          <p className="text-xs text-gray-400 mt-0.5 max-w-md">
            Overview of your linked children&apos;s academic progress.
          </p>
        </div>
      </header>

      <div className="px-6 py-8 flex flex-col gap-6">
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
                  Connect another child&apos;s student profile using their registered email address.
                </p>
              </div>

              <input
                type="email"
                value={linkEmail}
                onChange={e => { setLinkEmail(e.target.value); setLinkError(null) }}
                placeholder="Enter Email Address"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
              />

              {linkError   && <p className="text-xs text-red-500 -mt-2">{linkError}</p>}
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
      </div>
    </main>
  )
}
