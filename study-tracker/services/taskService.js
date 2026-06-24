import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function analyzeFocusFrame(base64Frame) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Frame,
      },
    },
    `Analyze this image of a student studying.
     Respond ONLY with a JSON object, no markdown, no extra text:
     {"focused": true, "reason": null}
     or
     {"focused": false, "reason": "phone_detected" | "not_writing" | "talking"}
     focused is false if: a phone is visible, the student is not reading/writing, or mouth is moving.`,
  ])

  const text = result.response.text()
  console.log('Gemini raw response:', text) // 👈 check your terminal

  const clean = text.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch (e) {
    console.error('Failed to parse Gemini response:', clean)
    // Fallback — assume focused so we don't spam warnings
    return { focused: true, reason: null }
  }
}