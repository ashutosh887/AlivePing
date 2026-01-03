export interface SMSConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

export interface SendSMSOptions {
  to: string
  message: string
}

let smsConfig: SMSConfig | null = null

export const initializeSMS = (config: SMSConfig) => {
  smsConfig = config
}

export const sendSMS = async (options: SendSMSOptions): Promise<boolean> => {
  if (!smsConfig) {
    console.warn('SMS service not configured. Set EXPO_PUBLIC_TWILIO_* environment variables.')
    return false
  }

  try {
    const response = await fetch('https://api.aliveping.app/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        message: options.message,
      }),
    })

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    
    if (process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID && process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN) {
      return await sendSMSDirect(options)
    }
    
    return false
  }
}

const sendSMSDirect = async (options: SendSMSOptions): Promise<boolean> => {
  if (!smsConfig) return false

  try {
    const accountSid = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID || smsConfig.accountSid
    const authToken = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN || smsConfig.authToken
    const fromNumber = process.env.EXPO_PUBLIC_TWILIO_FROM_NUMBER || smsConfig.fromNumber

    const credentials = base64Encode(`${accountSid}:${authToken}`)
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: options.to,
          Body: options.message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Twilio API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Direct SMS send error:', error)
    return false
  }
}

const base64Encode = (str: string): string => {
  if (typeof btoa !== 'undefined') {
    return btoa(str)
  }
  try {
    const base64 = require('base-64')
    return base64.encode(str)
  } catch {
    return Buffer.from(str).toString('base64')
  }
}

export const generateAlertMessage = (
  eventType: 'check_in_missed' | 'panic' | 'alert',
  location?: { latitude: number; longitude: number },
  userName?: string
): string => {
  const name = userName || 'User'
  const timestamp = new Date().toLocaleString()
  const locationStr = location 
    ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
    : 'Location: Unknown'

  switch (eventType) {
    case 'panic':
      return `🚨 PANIC ALERT from ${name}\n\nTime: ${timestamp}\n${locationStr}\n\nThis is an emergency. Please check on them immediately.\n\n- AlivePing Safety System`
    
    case 'check_in_missed':
      return `⚠️ MISSED CHECK-IN from ${name}\n\nTime: ${timestamp}\n${locationStr}\n\nThey did not confirm their safety check-in. Please check on them.\n\n- AlivePing Safety System`
    
    case 'alert':
      return `⚠️ SAFETY ALERT from ${name}\n\nTime: ${timestamp}\n${locationStr}\n\nA safety alert has been triggered. Please check on them.\n\n- AlivePing Safety System`
    
    default:
      return `⚠️ Safety Alert from ${name} at ${timestamp}`
  }
}
