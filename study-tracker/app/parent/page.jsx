'use client'

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { DEMO_PARENT_ID } from '@/lib/demoUsers'
import ChildCard from '@/components/ChildCard'
import PortalSidebar, { MenuButton } from '@/components/shared/PortalSidebar'

export default function ParentPage() {
  const [menuOpen, setMenuOpen]       = useState(false)
  const [parent, setParent]           = useState(null)
  const [children, setChildren]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [linkEmail, setLinkEmail]     = useState('')
  const [linking, setLinking]         = useState(false)
  const [linkError, setLinkError]     = useState(null)
  const [linkSuccess, setLinkSuccess] = useState(false)
  const DEMO_PARENT_ID='bbbbbbbb-0000-0000-0000-000000000001'
  async function loadChildren() {
    try {
      const [profRes, conRes] = await Promise.all([
        fetch('/api/profile', { headers: { 'x-user-id': DEMO_PARENT_ID } }).then(r => r.json()),
        fetch('/api/parent/connections', { headers: { 'x-user-id': DEMO_PARENT_ID } }).then(r => r.json()),
      ])
      setParent(profRes.profile)
      setChildren(conRes.children ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadChildren() }, [])

  async function handleLinkStudent() {
    if (!linkEmail.trim()) return
    setLinking(true)
    setLinkError(null)
    setLinkSuccess(false)

    try {
      const res = await fetch('/api/parent/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': DEMO_PARENT_ID },
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

  const parentName = parent?.display_name ?? parent?.full_name ?? 'Parent'

  return (
    <main className="min-h-screen bg-white">
      <PortalSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navItems={[]}
        profileName={parentName}
        profileRole="Parent"
      />

      <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white">
        <MenuButton onClick={() => setMenuOpen(true)} />
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
