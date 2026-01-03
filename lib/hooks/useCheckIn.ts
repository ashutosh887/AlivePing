import { useAppStore } from '@/lib/store'
import { getCurrentLocation, hashLocation } from '@/lib/location/locationService'
import { startCheckIn as solanaStartCheckIn, confirmSafe as solanaConfirmSafe } from '@/lib/solana/program'
import { logEvent } from '@/lib/monitoring/datadog'
import { DATADOG_EVENTS } from '@/lib/constants/datadog'
import { publishSafetyEvent } from '@/lib/monitoring/events'
import { getWalletPublicKey } from '@/lib/solana/wallet'
import { useEffect, useState } from 'react'

export const useCheckIn = () => {
  const checkIn = useAppStore((s) => s.checkIn)
  const storeStartCheckIn = useAppStore((s) => s.startCheckIn)
  const storeConfirmCheckIn = useAppStore((s) => s.confirmCheckIn)
  const cancelCheckIn = useAppStore((s) => s.cancelCheckIn)
  const triggerAlert = useAppStore((s) => s.triggerAlert)
  const cancelAlert = useAppStore((s) => s.cancelAlert)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const startCheckIn = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    try {
      const location = await getCurrentLocation()
      const locationHash = location ? await hashLocation(location) : new Array(32).fill(0)
      
      const deadline = Math.floor((Date.now() + 5 * 60 * 1000) / 1000)
      
      try {
        await solanaStartCheckIn(deadline, locationHash)
      } catch (error) {
        console.error('Solana start check-in error:', error)
      }

      storeStartCheckIn(location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      } : undefined)

      const userId = await getWalletPublicKey()
      await logEvent({
        event: DATADOG_EVENTS.CHECK_IN_START,
        payload: {
          userId,
          locationAvailable: !!location,
        },
      })
      await publishSafetyEvent('check_in_started', userId, { location: location ? 'available' : 'unavailable' })
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

      const userId = await getWalletPublicKey()
      await logEvent({
        event: DATADOG_EVENTS.CHECK_IN_CONFIRMED,
        payload: {
          userId,
        },
      })
      await publishSafetyEvent('check_in_confirmed', userId)
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
          triggerAlert(location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          } : undefined)
        } catch {
          triggerAlert()
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
      getWalletPublicKey().then((userId) => {
        logEvent({
          event: DATADOG_EVENTS.ALERT_TRIGGERED,
          payload: {
            userId,
          },
        })
        publishSafetyEvent('alert_triggered', userId)
      })
    }
  }, [isAlertActive])

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

