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

export interface WhatsAppTemplateParams {
  eventType: 'panic' | 'check_in_missed' | 'alert'
  userName?: string
  timestamp: string
  location?: string
  locationLink?: string
  batteryInfo?: string
}

const getTemplateName = (): string => {
  return process.env.EXPO_PUBLIC_WHATSAPP_TEMPLATE_NAME || 'aliveping_safety_alert_v1'
}

export const sendWhatsApp = async (options: SendWhatsAppOptions | { to: string; templateParams: WhatsAppTemplateParams }): Promise<boolean> => {
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
    const templateName = getTemplateName()
    
    let requestBody: any
    
    if ('templateParams' in options) {
      const params = options.templateParams
      const bodyParams: any[] = []
      
      const alertTypeText = params.eventType === 'panic' 
        ? 'PANIC ALERT' 
        : params.eventType === 'check_in_missed' 
          ? 'MISSED CHECK-IN' 
          : 'SAFETY ALERT'
      
      bodyParams.push({ type: 'text', text: alertTypeText })
      bodyParams.push({ type: 'text', text: params.userName || 'User' })
      bodyParams.push({ type: 'text', text: params.timestamp })
      
      if (params.location) {
        bodyParams.push({ type: 'text', text: params.location })
      } else {
        bodyParams.push({ type: 'text', text: 'Unknown' })
      }
      
      if (params.locationLink) {
        bodyParams.push({ type: 'text', text: params.locationLink })
      } else {
        bodyParams.push({ type: 'text', text: 'N/A' })
      }
      
      if (params.batteryInfo) {
        bodyParams.push({ type: 'text', text: params.batteryInfo })
      } else {
        bodyParams.push({ type: 'text', text: 'N/A' })
      }
      
      requestBody = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: [{
            type: 'body',
            parameters: bodyParams
          }]
        },
      }
    } else {
      requestBody = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
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
): WhatsAppTemplateParams => {
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

