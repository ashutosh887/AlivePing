import { Platform } from 'react-native'
import { DATADOG_EVENTS } from '@/lib/constants/datadog'
import { logEvent } from '@/lib/monitoring/datadog'

export interface SendWhatsAppOptions {
  to: string
  message: string
}

const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '')
}

export const getAlertPhoneNumber = (): string => {
  if (Platform.OS === 'ios') {
    const phone = process.env.EXPO_PUBLIC_WHATSAPP_ALERT_PHONE_IOS
    if (!phone) {
      throw new Error('EXPO_PUBLIC_WHATSAPP_ALERT_PHONE_IOS not set in .env')
    }
    return phone
  }
  const phone = process.env.EXPO_PUBLIC_WHATSAPP_ALERT_PHONE_ANDROID
  if (!phone) {
    throw new Error('EXPO_PUBLIC_WHATSAPP_ALERT_PHONE_ANDROID not set in .env')
  }
  return phone
}

const getWhatsAppConfig = () => {
  const accessToken = process.env.EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '948276015032580'
  
  if (!accessToken) {
    return null
  }
  
  return {
    accessToken,
    phoneNumberId,
  }
}

export const sendWhatsApp = async (options: SendWhatsAppOptions): Promise<boolean> => {
  const config = getWhatsAppConfig()
  if (!config) {
    return false
  }

  try {
    const phoneNumber = formatPhoneNumber(options.to)
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return false
    }
    
    const url = `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`
    
    const requestBody = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: options.message,
      },
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const responseText = await response.text()
    
    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
        const errorCode = errorData?.error?.code
        const errorMessage = errorData?.error?.message || ''
        
        if (errorCode === 190) {
          logEvent({
            event: DATADOG_EVENTS.WHATSAPP_TOKEN_EXPIRED,
            payload: { errorCode, errorMessage },
          })
          return false
        }
        
        if (errorCode === 131047 || errorCode === 131026) {
          const templateBody = {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
              name: 'jaspers_market_plain_text_v1',
              language: { code: 'en_US' },
              components: [{
                type: 'body',
                parameters: [{
                  type: 'text',
                  text: options.message.substring(0, 1024)
                }]
              }]
            },
          }
          
          const templateResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateBody),
          })
          
          const templateResponseText = await templateResponse.text()
          
          if (!templateResponse.ok) {
            return false
          }
          
          const templateResult = JSON.parse(templateResponseText)
          if (templateResult.error) {
            return false
          }
          
          if (templateResult.messages && templateResult.messages[0]?.id) {
            logEvent({
              event: DATADOG_EVENTS.WHATSAPP_SENT,
              payload: { messageId: templateResult.messages[0].id, platform: Platform.OS },
            })
            return true
          }
          
          return false
        }
      } catch (e) {
      }
      return false
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      return false
    }
    
    if (result.error) {
      return false
    }

    if (result.messages && result.messages[0] && result.messages[0].id) {
      logEvent({
        event: DATADOG_EVENTS.WHATSAPP_SENT,
        payload: { messageId: result.messages[0].id, platform: Platform.OS },
      })
      return true
    }

    logEvent({
      event: DATADOG_EVENTS.WHATSAPP_FAILED,
      payload: { reason: 'unexpected_response', response: result },
    })
    return false
  } catch (error: any) {
    logEvent({
      event: DATADOG_EVENTS.WHATSAPP_FAILED,
      payload: { 
        reason: 'exception', 
        error: error?.message,
        platform: Platform.OS,
      },
    })
    return false
  }
}

export interface WhatsAppBatteryInfo {
  batteryLevel: number
  isCharging: boolean
  deviceModel: string
  manufacturer: string
}

export const generateAlertMessage = (
  eventType: 'check_in_missed' | 'panic' | 'alert',
  location?: { latitude: number; longitude: number },
  userName?: string,
  batteryInfo?: WhatsAppBatteryInfo | null
): string => {
  const name = userName || 'User'
  const timestamp = new Date().toLocaleString()
  
  let locationStr = 'Location: Unknown'
  let locationLink = ''
  
  if (location) {
    const lat = location.latitude.toFixed(6)
    const lng = location.longitude.toFixed(6)
    locationStr = `Location: ${lat}, ${lng}`
    locationLink = `\n📍 View on Map: https://www.google.com/maps?q=${lat},${lng}`
  }

  let batteryStr = ''
  if (batteryInfo) {
    const batteryStatus = batteryInfo.isCharging ? 'Charging' : `${batteryInfo.batteryLevel}%`
    batteryStr = `\n🔋 Battery: ${batteryStatus} (${batteryInfo.manufacturer} ${batteryInfo.deviceModel})`
  }

  switch (eventType) {
    case 'panic':
      return `🚨 PANIC ALERT from ${name}\n\nTime: ${timestamp}\n${locationStr}${locationLink}${batteryStr}\n\nThis is an emergency. Please check on them immediately.\n\n- AlivePing Safety System`
    
    case 'check_in_missed':
      return `⚠️ MISSED CHECK-IN from ${name}\n\nTime: ${timestamp}\n${locationStr}${locationLink}${batteryStr}\n\nThey did not confirm their safety check-in. Please check on them.\n\n- AlivePing Safety System`
    
    case 'alert':
      return `⚠️ SAFETY ALERT from ${name}\n\nTime: ${timestamp}\n${locationStr}${locationLink}${batteryStr}\n\nA safety alert has been triggered. Please check on them.\n\n- AlivePing Safety System`
    
    default:
      return `⚠️ Safety Alert from ${name} at ${timestamp}${locationLink}${batteryStr}`
  }
}

