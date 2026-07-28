/** Client-side helper — posts focus events to the server (no direct DB access). */
export async function logFocusEvent({
  sessionId,
  userId,
  reason,
  distractionDuration,
  totalDistracted,
  screenNote,
  screenFlagged,
}) {
  const res = await fetch('/api/focus/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({
      sessionId,
      reason,
      distractionDuration,
      totalDistracted,
      screenNote,
      screenFlagged,
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to log focus event')
  }
}
