import { DATADOG_EVENTS } from '@/lib/constants/datadog'
import { logEvent } from '@/lib/monitoring/datadog'
import { Platform } from 'react-native'

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

export interface WhatsAppAlertParams {
  eventType: 'panic' | 'check_in_missed' | 'alert'
  userName?: string
  timestamp: string
  location?: string
  locationLink?: string
  batteryInfo?: string
}

export const sendWhatsApp = async (options: SendWhatsAppOptions | { to: string; alertParams: WhatsAppAlertParams }): Promise<boolean> => {
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
    
    let messageText: string
    
    if ('alertParams' in options) {
      const params = options.alertParams
      const alertTypeText = params.eventType === 'panic' 
        ? '🚨 PANIC ALERT' 
        : params.eventType === 'check_in_missed' 
          ? '⏰ MISSED CHECK-IN' 
          : '⚠️ SAFETY ALERT'
      
      let message = `${alertTypeText}\n\n`
      message += `User: ${params.userName || 'User'}\n`
      message += `Time: ${params.timestamp}\n\n`
      
      if (params.location) {
        message += `Location: ${params.location}\n`
      } else {
        message += `Location: Unknown\n`
      }
      
      if (params.locationLink) {
        message += `Map: ${params.locationLink}\n`
      }
      
      if (params.batteryInfo) {
        message += `Battery: ${params.batteryInfo}\n`
      }
      
      messageText = message
    } else {
      messageText = options.message
    }
    
    const requestBody = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: messageText.substring(0, 4096)
      }
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
): WhatsAppAlertParams => {
  const name = userName || 'User'
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  
  let locationStr: string | undefined
  let locationLink: string | undefined
  
  if (location) {
    const lat = location.latitude.toFixed(6)
    const lng = location.longitude.toFixed(6)
    locationStr = `${lat}, ${lng}`
    locationLink = `https://www.google.com/maps?q=${lat},${lng}`
  }

  let batteryStr: string | undefined
  if (batteryInfo) {
    const batteryStatus = batteryInfo.isCharging ? 'Charging' : `${batteryInfo.batteryLevel}%`
    batteryStr = `${batteryStatus} (${batteryInfo.manufacturer} ${batteryInfo.deviceModel})`
  }

  return {
    eventType,
    userName: name,
    timestamp,
    location: locationStr,
    locationLink,
    batteryInfo: batteryStr,
  }
}

