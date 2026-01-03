import { encode } from 'base-64'

type SafetyEvent = {
  type: 'check_in_started' | 'check_in_confirmed' | 'check_in_expired' | 'alert_triggered'
  userId: string
  timestamp: number
  data?: Record<string, any>
}

const getConfluentAuth = () => {
  const apiKey = process.env.EXPO_PUBLIC_CONFLUENT_API_KEY
  const apiSecret = process.env.EXPO_PUBLIC_CONFLUENT_API_SECRET
  
  if (!apiKey || !apiSecret) {
    return null
  }

  const credentials = `${apiKey}:${apiSecret}`
  return `Basic ${encode(credentials)}`
}

const publishToConfluent = async (topic: string, event: SafetyEvent) => {
  const clusterId = process.env.EXPO_PUBLIC_CONFLUENT_CLUSTER_ID
  const restEndpoint = process.env.EXPO_PUBLIC_CONFLUENT_REST_ENDPOINT
  const auth = getConfluentAuth()

  if (!clusterId || !auth || !restEndpoint) {
    console.log('Confluent not configured, skipping event:', event.type)
    return
  }

  try {
    const url = `https://${restEndpoint}/kafka/v3/clusters/${clusterId}/topics/${topic}/records`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify({
        records: [
          {
            value: {
              type: event.type,
              userId: event.userId,
              timestamp: event.timestamp,
              data: event.data || {},
            },
            key: event.userId,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Confluent publish error:', response.status, errorText)
    } else {
      console.log('Event published to Confluent:', event.type)
    }
  } catch (error) {
    console.error('Confluent publish error:', error)
  }
}

export const publishSafetyEvent = async (
  eventType: 'check_in_started' | 'check_in_confirmed' | 'check_in_expired' | 'alert_triggered',
  userId: string,
  metadata?: Record<string, any>
) => {
  const event: SafetyEvent = {
    type: eventType,
    userId,
    timestamp: Date.now(),
    data: metadata,
  }

  const topic = process.env.EXPO_PUBLIC_CONFLUENT_TOPIC || 'safety-events'

  if (process.env.EXPO_PUBLIC_CONFLUENT_CLUSTER_ID) {
    await publishToConfluent(topic, event)
  } else {
    console.log('Confluent not configured, logging event:', event)
  }
}

export const publishEvent = async (
  topic: string,
  event: {
    type: string
    userId: string
    timestamp: number
    data?: Record<string, any>
  }
) => {
  await publishSafetyEvent(
    event.type as any,
    event.userId,
    event.data
  )
}
