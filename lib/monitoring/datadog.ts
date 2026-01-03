type LogEvent = {
  event: string
  incidentId?: string
  payload?: Record<string, any>
}

const endpoint = `https://http-intake.logs.${process.env.EXPO_PUBLIC_DATADOG_SITE || 'datadoghq.com'}/v1/input`

export async function logEvent({
  event,
  incidentId,
  payload,
}: LogEvent) {
  const apiKey = process.env.EXPO_PUBLIC_DATADOG_API_KEY
  if (!apiKey) return

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": apiKey,
      },
      body: JSON.stringify({
        service: process.env.EXPO_PUBLIC_DATADOG_SERVICE || "aliveping-mobile",
        ddsource: process.env.EXPO_PUBLIC_DATADOG_SOURCE || "react-native",
        message: event,
        incidentId,
        payload,
        timestamp: Date.now(),
      }),
    })
  } catch (error) {
    console.error('Datadog log error:', error)
  }
}

