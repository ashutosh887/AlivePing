import { getLocalWalletPublicKey } from '@/lib/solana/localWallet'
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
    return
  }

  try {
    const url = `https://${restEndpoint}/kafka/v3/clusters/${clusterId}/topics/${topic}/records`
    
    const eventValue = {
      type: event.type,
      userId: event.userId,
      timestamp: event.timestamp,
      data: event.data || {},
    }
    
    const requestBody = {
      partition_id: 0,
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      key: {
        type: 'STRING',
        data: event.userId,
      },
      value: {
        type: 'STRING',
        data: JSON.stringify(eventValue),
      },
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
    }
  } catch (error: any) {
  }
}

export const publishSafetyEvent = async (
  eventType: 'check_in_started' | 'check_in_confirmed' | 'check_in_expired' | 'alert_triggered',
  userId: string | null | undefined,
  metadata?: Record<string, any>
) => {
  let finalUserId = userId
  
  if (!finalUserId) {
    const localWalletKey = await getLocalWalletPublicKey()
    if (localWalletKey) {
      finalUserId = localWalletKey
    }
  }
  
  if (!finalUserId) {
    return
  }

  const event: SafetyEvent = {
    type: eventType,
    userId: finalUserId,
    timestamp: Date.now(),
    data: metadata,
  }

  const topic = process.env.EXPO_PUBLIC_CONFLUENT_TOPIC || 'AlivePing'

  if (process.env.EXPO_PUBLIC_CONFLUENT_CLUSTER_ID) {
    await publishToConfluent(topic, event)
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
