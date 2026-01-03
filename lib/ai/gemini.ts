type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

export const analyzeSafetyContext = async (
  location: { latitude: number; longitude: number } | null,
  timeOfDay: string,
  recentEvents: number
): Promise<string | null> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const prompt = `Analyze this safety check-in context and provide a brief risk assessment (1-2 sentences):
- Location: ${location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Unknown'}
- Time: ${timeOfDay}
- Recent activity: ${recentEvents} check-ins today

Provide a concise safety context assessment.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      return null
    }

    const data: GeminiResponse = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch (error) {
    console.error('Gemini API error:', error)
    return null
  }
}

export const generateAlertMessage = async (
  eventType: 'check_in' | 'panic' | 'alert',
  location: { latitude: number; longitude: number } | null
): Promise<string | null> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const prompt = `Generate a concise, professional alert message for a personal safety app:
- Event type: ${eventType}
- Location: ${location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Unknown'}
- Time: ${new Date().toLocaleString()}

Generate a short, clear message (max 100 characters) that would be sent to trusted contacts.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      return null
    }

    const data: GeminiResponse = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch (error) {
    console.error('Gemini API error:', error)
    return null
  }
}

