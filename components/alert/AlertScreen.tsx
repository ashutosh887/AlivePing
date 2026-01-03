import { Button } from '@/components/ui/Button'
import { useCheckIn } from '@/lib/hooks/useCheckIn'
import * as Haptics from 'expo-haptics'
import { AlertTriangle } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export const AlertScreen = () => {
  const { checkIn, cancelAlert, isAlertActive } = useCheckIn()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    if (!checkIn?.graceWindowEnd) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = checkIn.graceWindowEnd! - now
      setTimeRemaining(Math.max(0, remaining))
    }, 1000)

    const now = Date.now()
    const remaining = checkIn.graceWindowEnd! - now
    setTimeRemaining(Math.max(0, remaining))

    return () => clearInterval(interval)
  }, [checkIn?.graceWindowEnd])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isAlertActive) {
    return null
  }

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    cancelAlert()
  }

  return (
    <SafeAreaView className="flex-1 bg-red-50" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-36 h-36 rounded-full bg-red-100 items-center justify-center mb-10">
          <AlertTriangle size={72} color="#EF4444" fill="#EF4444" />
        </View>

        <Text className="text-3xl font-bold text-brand-black mb-4 text-center">
          Alert Active
        </Text>

        <Text className="text-base text-brand-muted text-center mb-8 px-4 leading-6">
          Your trusted contacts have been notified. You can cancel during the grace window.
        </Text>

        {timeRemaining > 0 && (
          <View className="mb-10 items-center">
            <Text className="text-sm text-brand-muted mb-3 font-medium">Time to cancel</Text>
            <Text className="text-5xl font-bold text-brand-black tracking-tight">
              {formatTime(timeRemaining)}
            </Text>
          </View>
        )}

        {timeRemaining > 0 ? (
          <Button
            onPress={handleCancel}
            variant="secondary"
            size="lg"
            fullWidth
            className="bg-brand-white"
          >
            Cancel Alert
          </Button>
        ) : (
          <View className="w-full py-5 rounded-2xl bg-brand-light">
            <Text className="text-center text-brand-muted text-xl font-semibold">
              Grace Window Expired
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

