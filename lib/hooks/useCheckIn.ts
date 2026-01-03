import { DATADOG_EVENTS } from '@/lib/constants/datadog'
import { getCurrentLocation, getLastKnownLocation, hashLocation } from '@/lib/location/locationService'
import { logEvent } from '@/lib/monitoring/datadog'
import { publishSafetyEvent } from '@/lib/monitoring/events'
import { updateLastKnownState } from '@/lib/services/phoneOffFallback'
import { generateAlertMessage, sendSMS } from '@/lib/services/sms'
import { confirmSafe as solanaConfirmSafe, startCheckIn as solanaStartCheckIn } from '@/lib/solana/program'
import { getWalletPublicKey } from '@/lib/solana/wallet'
import { useAppStore } from '@/lib/store'
import { useEffect, useState } from 'react'

export const useCheckIn = () => {
  const checkIn = useAppStore((s) => s.checkIn)
  const storeStartCheckIn = useAppStore((s) => s.startCheckIn)
  const storeConfirmCheckIn = useAppStore((s) => s.confirmCheckIn)
  const cancelCheckIn = useAppStore((s) => s.cancelCheckIn)
  const triggerAlert = useAppStore((s) => s.triggerAlert)
  const cancelAlert = useAppStore((s) => s.cancelAlert)
  const trustedContacts = useAppStore((s) => s.trustedContacts)
  const notificationPreferences = useAppStore((s) => s.notificationPreferences)
  const appSettings = useAppStore((s) => s.appSettings)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const startCheckIn = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    try {
      const location = await getCurrentLocation()
      const locationHash = location ? await hashLocation(location) : new Array(32).fill(0)
      
      const durationMs = (appSettings.checkInDurationMinutes || 5) * 60 * 1000
      const deadline = Math.floor((Date.now() + durationMs) / 1000)
      
      try {
        await solanaStartCheckIn(deadline, locationHash)
      } catch (error) {
        console.error('Solana start check-in error:', error)
      }

      const locationData = location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      } : undefined

      storeStartCheckIn(locationData)

      updateLastKnownState({
        timestamp: Date.now(),
        location: locationData,
        checkInStatus: 'active',
        eventType: 'check_in',
      })

      const userId = await getWalletPublicKey()
      if (userId) {
        await logEvent({
          event: DATADOG_EVENTS.CHECK_IN_START,
          payload: {
            userId,
            locationAvailable: !!location,
          },
        })
        await publishSafetyEvent('check_in_started', userId, { location: location ? 'available' : 'unavailable' })
      }
    } catch (error) {
      console.error('Start check-in error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmCheckIn = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    try {
      try {
        await solanaConfirmSafe()
      } catch (error) {
        console.error('Solana confirm safe error:', error)
      }

      storeConfirmCheckIn()

      updateLastKnownState({
        timestamp: Date.now(),
        location: useAppStore.getState().events.find(e => e.type === "CHECK_IN" && e.status === "confirmed")?.location,
        checkInStatus: 'confirmed',
        eventType: 'check_in',
      })

      const userId = await getWalletPublicKey()
      if (userId) {
        await logEvent({
          event: DATADOG_EVENTS.CHECK_IN_CONFIRMED,
          payload: {
            userId,
          },
        })
        await publishSafetyEvent('check_in_confirmed', userId)
      }
    } catch (error) {
      console.error('Confirm check-in error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (!checkIn?.isActive) {
      setTimeRemaining(null)
      return
    }

    const isAlertActive = checkIn.graceWindowEnd && Date.now() < checkIn.graceWindowEnd
    if (isAlertActive) {
      setTimeRemaining(0)
      return
    }

    const interval = setInterval(async () => {
      const now = Date.now()
      const remaining = checkIn.checkInTime - now

      if (remaining <= 0) {
        try {
          const location = await getCurrentLocation()
          const locationData = location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          } : undefined
          triggerAlert(locationData)
          updateLastKnownState({
            timestamp: Date.now(),
            location: locationData,
            checkInStatus: 'expired',
            eventType: 'check_in',
          })
        } catch {
          const lastLocation = await getLastKnownLocation()
          const locationData = lastLocation ? {
            latitude: lastLocation.latitude,
            longitude: lastLocation.longitude,
            accuracy: lastLocation.accuracy,
          } : undefined
          triggerAlert(locationData)
          updateLastKnownState({
            timestamp: Date.now(),
            location: locationData,
            checkInStatus: 'expired',
            eventType: 'check_in',
          })
        }
        setTimeRemaining(0)
      } else {
        setTimeRemaining(remaining)
      }
    }, 1000)

    const now = Date.now()
    const remaining = checkIn.checkInTime - now
    setTimeRemaining(remaining > 0 ? remaining : 0)

    return () => clearInterval(interval)
  }, [checkIn, triggerAlert])

  const isAlertActive = checkIn?.graceWindowEnd && Date.now() < checkIn.graceWindowEnd

  useEffect(() => {
    if (isAlertActive) {
      const sendAlertNotifications = async () => {
        const userId = await getWalletPublicKey()
        
        if (userId) {
          await logEvent({
            event: DATADOG_EVENTS.ALERT_TRIGGERED,
            payload: {
              userId,
            },
          })
          await publishSafetyEvent('alert_triggered', userId)
        }

        if (notificationPreferences.smsEnabled && trustedContacts.length > 0) {
          const activeEvent = useAppStore.getState().events.find(
            e => e.type === "CHECK_IN" && e.status === "triggered"
          )
          
          const location = activeEvent?.location
          const alertMessage = generateAlertMessage('check_in_missed', location)

          const contactsToNotify = [...trustedContacts]
          if (appSettings.userPhoneNumber) {
            contactsToNotify.push({
              id: 'self',
              name: 'Self',
              phone: appSettings.userPhoneNumber,
              isPrimary: false,
            })
          }

          const smsPromises = contactsToNotify.map(contact =>
            sendSMS({
              to: contact.phone,
              message: alertMessage,
            }).catch(error => {
              console.error(`Failed to send SMS to ${contact.name}:`, error)
              return false
            })
          )

          await Promise.allSettled(smsPromises)
        }
      }

      sendAlertNotifications()
    }
  }, [isAlertActive, trustedContacts, notificationPreferences.smsEnabled, appSettings.userPhoneNumber])

  return {
    checkIn,
    timeRemaining,
    isAlertActive,
    isProcessing,
    startCheckIn,
    confirmCheckIn,
    cancelCheckIn,
    triggerAlert,
    cancelAlert,
  }
}

