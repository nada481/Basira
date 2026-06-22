import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

export async function analyzeFocusFrame(base64Frame)
{
    const model = genAI.getGenerativeModel({ model : 'gemini-2.0-flash'})
     const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Frame
      }
    },
    `Analyze this image of a student studying.
     Respond ONLY with a JSON object, no extra text:
     {
       "focused": true or false,
       "reason": "phone_detected" | "not_writing" | "talking" | null
     }
     focused is false if: a phone is visible, the student is not writing or reading, or their mouth is moving.`
  ])

  const text = result.response.text()
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}