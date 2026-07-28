'use client'

import { useState, useEffect } from 'react'
import PortalSidebar, { MenuButton } from '@/components/shared/PortalSidebar'
import { PARENT_NAV } from '@/lib/portalNav'
import { DEMO_PARENT_ID } from '@/lib/demoUsers'

export default function ParentSidebar() {
  const [open, setOpen]       = useState(false)
  const [profileName, setName] = useState('Parent')

  useEffect(() => {
    fetch('/api/profile', { headers: { 'x-user-id': DEMO_PARENT_ID } })
      .then(r => r.json())
      .then(data => {
        const p = data.profile
        if (p) setName(p.display_name ?? p.full_name ?? 'Parent')
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <MenuButton onClick={() => setOpen(true)} />
      <PortalSidebar
        open={open}
        onClose={() => setOpen(false)}
        navItems={PARENT_NAV}
        profileName={profileName}
        profileRole="Parent"
      />
    </>
  )
}
