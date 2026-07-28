'use client'

import { useState, useEffect } from 'react'
import PortalSidebar, { MenuButton } from '@/components/shared/PortalSidebar'
import { STUDENT_NAV } from '@/lib/portalNav'
import { DEMO_STUDENT_ID } from '@/lib/demoUsers'

export default function StudentSidebar() {
  const [open, setOpen]       = useState(false)
  const [profileName, setName] = useState('Student')

  useEffect(() => {
    fetch('/api/profile', { headers: { 'x-user-id': DEMO_STUDENT_ID } })
      .then(r => r.json())
      .then(data => {
        const p = data.profile
        if (p) setName(p.display_name ?? p.full_name ?? 'Student')
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <MenuButton onClick={() => setOpen(true)} />
      <PortalSidebar
        open={open}
        onClose={() => setOpen(false)}
        navItems={STUDENT_NAV}
        profileName={profileName}
        profileRole="Student"
      />
    </>
  )
}
