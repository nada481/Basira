'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/shared/Sidebar'
import ConnCard from '@/components/connections/ConnCard'
import AddCard from '@/components/connections/AddCard'
import SectionHeader from '@/components/connections/SectionHeader'
import SkeletonCard from '@/components/connections/SkeletonCard'
import AddGuardianModal from '@/components/connections/AddGuardianmodal'
import { IconFamily, IconTeacher, IconPlus } from '@/components/connections/icons'

export default function ConnectionsPage() {
  const [parent, setParent] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  async function fetchConnections() {
    try {
      setLoading(true)
      const res = await fetch('/api/connections', {
        headers: { 'x-user-id': 'cccccccc-0000-0000-0000-000000000001' },
      })
      if (!res.ok) throw new Error('Failed to load connections')
      const data = await res.json()
      setParent(data.parent)
      setTeachers(data.teachers ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConnections() }, [])

  return (
    <main className="w-full px-8 py-6">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-1">
        <Sidebar />
        <h1 className="text-3xl font-bold text-[#8B1A4A]">My Connections</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Manage your linked <span className="text-[#8B1A4A]">family members</span> and <span className="text-[#8B1A4A]">teachers</span>
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-pink-50 text-[#880e4f] text-sm">
          {error}
        </div>
      )}

      {/* ── Family ── */}
      <SectionHeader
        icon={<IconFamily />}
        label="Family"
        iconBg="#f0eeff"
        right={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-[#8B1A4A] px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors border-none bg-transparent cursor-pointer"
          >
            <IconPlus /> Add Guardian
          </button>
        }
      />

      {loading ? <SkeletonCard /> : parent
        ? <ConnCard profile={parent} index={0} />
        : <p className="text-sm text-gray-300 py-3">No guardian linked yet.</p>
      }
      {!parent && (
        <AddCard
          label="Add a family member"
          sublabel="Link a parent, guardian, or sibling"
          onClick={() => setModalOpen(true)}
        />
      )}

      {/* ── Teachers ── */}
      <SectionHeader
        icon={<IconTeacher />}
        label="Teachers"
        iconBg="#e8f5e9"
        right={<span className="text-xs italic text-[#8B1A4A]">Assigned for current semester</span>}
      />

      {loading
        ? <><SkeletonCard /><SkeletonCard /></>
        : teachers.length > 0
          ? teachers.map((teacher, i) => <ConnCard key={`${teacher.id}-${i}`} profile={teacher} index={i + 1} showProgress />)

          : <p className="text-sm text-gray-300 py-3">No teachers assigned yet.</p>
      }
      <AddCard label="Add Connection" sublabel="Link a new tutor or family member" />

      <p className="mt-12 text-[11px] text-gray-200 tracking-widest text-center">
        PRIVACY PROTECTED · BASIRA QATAR EDUCATION PLATFORM
      </p>

      <AddGuardianModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchConnections}
      />

    </main>
  )
}