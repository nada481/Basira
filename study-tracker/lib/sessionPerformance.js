export const DISTRACTION_LABELS = {
  phone_detected:  'Phone detected',
  no_body:         'Away from desk',
  not_writing:     'Not reading or writing',
  not_looking:     'Not looking at the camera',
  talking:         'Talking detected',
  off_task_screen: 'Off-task screen activity',
}

export function getDistractionLabel(reason) {
  return DISTRACTION_LABELS[reason] ?? reason?.replace(/_/g, ' ') ?? 'Unknown'
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds ?? 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export function formatDistractionBreakdown(breakdown) {
  const entries = Object.entries(breakdown ?? {})
  if (!entries.length) return 'No distractions recorded during this session.'

  return entries
    .map(([reason, secs]) => `${getDistractionLabel(reason)} (${formatDuration(secs)})`)
    .join('; ')
}

export function buildSessionPerformanceSummary({
  studySeconds = 0,
  totalDistractedSeconds = 0,
  distractionBreakdown = {},
  distractions = [],
}) {
  const focusScore = studySeconds > 0
    ? Math.max(0, Math.round(100 - (totalDistractedSeconds / studySeconds) * 100))
    : (distractions.length ? Math.max(0, 100 - distractions.length * 5) : 100)

  const breakdownText = formatDistractionBreakdown(distractionBreakdown)
  const hadDistractions = totalDistractedSeconds > 0 || distractions.length > 0

  let narrative
  if (!hadDistractions) {
    narrative = `The student stayed focused for ${formatDuration(studySeconds)} with no recorded distractions.`
  } else {
    narrative = `During ${formatDuration(studySeconds)} of study time, the student was distracted for ${formatDuration(totalDistractedSeconds)}. Distractions included: ${breakdownText}.`
  }

  return {
    studySeconds,
    totalDistractedSeconds,
    focusScore,
    distractionBreakdown,
    distractions,
    hadDistractions,
    breakdownText,
    narrative,
  }
}
