import { sendWhatsApp, generateAlertMessage, getAlertPhoneNumber } from './whatsapp'
import { getLastKnownLocation } from '@/lib/location/locationService'
import { getBatteryInfo } from './battery'

export interface LastKnownState {
  timestamp: number
  location?: {
    latitude: number
    longitude: number
    accuracy: number | null
  }
  checkInStatus: 'active' | 'expired' | 'confirmed'
  eventType: 'check_in' | 'panic' | 'alert'
}

let lastKnownState: LastKnownState | null = null

export const updateLastKnownState = (state: LastKnownState) => {
  lastKnownState = state
}

export const getLastKnownState = (): LastKnownState | null => {
  return lastKnownState
}

export const escalateViaWhatsApp = async (
  userName?: string
): Promise<boolean> => {
  const lastState = getLastKnownState()
  const lastLocation = lastState?.location || await getLastKnownLocation()
  const batteryInfo = await getBatteryInfo()

  const eventType = lastState?.eventType === 'panic' 
    ? 'panic' 
    : lastState?.checkInStatus === 'expired' 
      ? 'check_in_missed' 
      : 'alert'

  const alertMessage = generateAlertMessage(
    eventType,
    lastLocation ? {
      latitude: lastLocation.latitude,
      longitude: lastLocation.longitude,
    } : undefined,
    userName,
    batteryInfo ? {
      batteryLevel: batteryInfo.batteryLevel,
      isCharging: batteryInfo.isCharging,
      deviceModel: batteryInfo.deviceModel,
      manufacturer: batteryInfo.manufacturer,
    } : null
  )

  const escalationMessage = `${alertMessage}\n\n⚠️ PHONE OFF: This alert was sent because the device could not be reached. Last known state: ${new Date(lastState?.timestamp || Date.now()).toLocaleString()}`

  const alertPhone = getAlertPhoneNumber()
  const result = await sendWhatsApp({
    to: alertPhone,
      message: escalationMessage,
  }).catch(() => false)

  return result
}
