import { DATADOG_EVENTS } from '@/lib/constants/datadog'
import { getCurrentLocation, getLastKnownLocation, hashLocation } from '@/lib/location/locationService'
import { logEvent } from '@/lib/monitoring/datadog'
import { publishSafetyEvent } from '@/lib/monitoring/events'
import { updateLastKnownState } from '@/lib/services/phoneOffFallback'
import { generateAlertMessage, sendWhatsApp, getAlertPhoneNumber } from '@/lib/services/whatsapp'
import { confirmSafe as solanaConfirmSafe, startCheckIn as solanaStartCheckIn } from '@/lib/solana/program'
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
  const wallet = useAppStore((s) => s.wallet)
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

      const userId = wallet.publicKey
      await logEvent({
        event: DATADOG_EVENTS.CHECK_IN_START,
        payload: {
          userId: userId || 'unknown',
          locationAvailable: !!location,
        },
      })
      await publishSafetyEvent('check_in_started', userId, { location: location ? 'available' : 'unavailable' })
    } catch (error) {
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
      }

      storeConfirmCheckIn()

      updateLastKnownState({
        timestamp: Date.now(),
        location: useAppStore.getState().events.find(e => e.type === "CHECK_IN" && e.status === "confirmed")?.location,
        checkInStatus: 'confirmed',
        eventType: 'check_in',
      })

      const userId = wallet.publicKey
      await logEvent({
        event: DATADOG_EVENTS.CHECK_IN_CONFIRMED,
        payload: {
          userId: userId || 'unknown',
        },
      })
      await publishSafetyEvent('check_in_confirmed', userId)
    } catch (error) {
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
        const userId = useAppStore.getState().wallet.publicKey
        
        await logEvent({
          event: DATADOG_EVENTS.ALERT_TRIGGERED,
          payload: {
            userId: userId || 'unknown',
          },
        })
        await publishSafetyEvent('alert_triggered', userId)

        const whatsappEnabled = notificationPreferences?.whatsappEnabled ?? true
        
        if (whatsappEnabled) {
          const activeEvent = useAppStore.getState().events.find(
            e => e.type === "CHECK_IN" && e.status === "triggered"
          )
          
          if (activeEvent) {
            const location = activeEvent.location
            const batteryService = await import('@/lib/services/battery')
            const currentBattery = await batteryService.getBatteryInfo()
            
            const templateParams = generateAlertMessage(
              'check_in_missed', 
              location, 
              undefined, 
              currentBattery ? {
                batteryLevel: currentBattery.batteryLevel,
                isCharging: currentBattery.isCharging,
                deviceModel: currentBattery.deviceModel,
                manufacturer: currentBattery.manufacturer,
              } : null
            )
            const alertPhone = getAlertPhoneNumber()
            const updateEventWhatsAppStatus = useAppStore.getState().updateEventWhatsAppStatus

            const sent = await sendWhatsApp({
              to: alertPhone,
              templateParams,
            }).catch(() => false)

            updateEventWhatsAppStatus(activeEvent.id, sent)
          }
        }
      }

      sendAlertNotifications()
    }
  }, [isAlertActive, notificationPreferences.whatsappEnabled])

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

