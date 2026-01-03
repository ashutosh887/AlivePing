import { sendSMS, generateAlertMessage } from './sms'
import { TrustedContact } from '@/lib/store'
import { getLastKnownLocation } from '@/lib/location/locationService'

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

export const escalateViaSMS = async (
  trustedContacts: TrustedContact[],
  userPhoneNumber: string | null,
  userName?: string
): Promise<boolean> => {
  if (trustedContacts.length === 0 && !userPhoneNumber) {
    console.warn('No trusted contacts available for SMS escalation')
    return false
  }

  const lastState = getLastKnownState()
  const lastLocation = lastState?.location || await getLastKnownLocation()

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
    userName
  )

  const escalationMessage = `${alertMessage}\n\n⚠️ PHONE OFF: This alert was sent because the device could not be reached. Last known state: ${new Date(lastState?.timestamp || Date.now()).toLocaleString()}`

  const contactsToNotify = [...trustedContacts]
  if (userPhoneNumber) {
    contactsToNotify.push({
      id: 'self',
      name: 'Self',
      phone: userPhoneNumber,
      isPrimary: false,
    })
  }

  const smsPromises = contactsToNotify.map(contact =>
    sendSMS({
      to: contact.phone,
      message: escalationMessage,
    }).catch(error => {
      console.error(`Failed to send escalation SMS to ${contact.name}:`, error)
      return false
    })
  )

  const results = await Promise.allSettled(smsPromises)
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length

  return successCount > 0
}
