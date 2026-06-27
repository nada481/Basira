export async function POST(req) {
  try {
    const { task, timeSpent, studentName } = await req.json()
 
    const minutes = Math.floor(timeSpent / 60)
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: '',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `A student named ${studentName} spent ${minutes}+ minutes on a single assignment without completing it.
 
Assignment details:
- Subject: ${task.subject}
- Title: ${task.taskName}
- Type: ${task.type}
- Teacher note: ${task.note ?? 'None'}

 
Write a short, professional note from the study app to the teacher/parent.
Respond ONLY with a JSON object, no markdown:
{
  "subject": "${task.subject}",
  "taskTitle": "${task.title}",
  "note": "2-sentence note explaining the student struggled and may need support",
  "suggestedAction": "one concrete suggestion for the teacher"
}`,
        }],
      }),
    })
 
    const data = await response.json()
    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
 
    return Response.json(JSON.parse(clean))
 
  } catch (error) {
    console.error('Summarize error:', error)
    return Response.json({ error: 'Failed to summarize' }, { status: 500 })
  }
}
 