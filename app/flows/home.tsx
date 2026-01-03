import { useAppStore } from '@/lib/store'
import * as Haptics from 'expo-haptics'
import { Clock } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const HomeScreen = () => {
  const checkIn = useAppStore((s) => s.checkIn)
  const startCheckIn = useAppStore((s) => s.startCheckIn)
  const confirmCheckIn = useAppStore((s) => s.confirmCheckIn)
  const triggerAlert = useAppStore((s) => s.triggerAlert)
  const cancelAlert = useAppStore((s) => s.cancelAlert)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

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

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = checkIn.checkInTime - now

      if (remaining <= 0) {
        triggerAlert()
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

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStartCheckIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    startCheckIn()
  }

  const handleConfirmCheckIn = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    confirmCheckIn()
  }

  const isAlertActive = checkIn?.graceWindowEnd && Date.now() < checkIn.graceWindowEnd

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-6">
        <View className="pt-8 pb-6">
          <Text className="text-3xl font-bold text-brand-black mb-2">
            Safety Check-In
          </Text>
          <Text className="text-base text-brand-muted">
            Stay connected with your trusted contacts
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          {!checkIn?.isActive ? (
            <View className="w-full items-center">
              <View className="w-24 h-24 rounded-full bg-brand-accent items-center justify-center mb-8">
                <Clock size={48} color="#000000" strokeWidth={2} />
              </View>

              <Pressable
                onPress={handleStartCheckIn}
                className="w-full py-5 rounded-xl border-2 border-brand-black bg-brand-black active:opacity-80"
              >
                <Text className="text-center text-brand-white text-xl font-semibold">
                  Start Safety Check-In
                </Text>
              </Pressable>

              <Text className="mt-4 text-sm text-brand-muted text-center px-4">
                You'll need to confirm you're safe in 5 minutes
              </Text>
            </View>
          ) : isAlertActive ? (
            <View className="w-full items-center">
              <View className="w-24 h-24 rounded-full bg-red-100 items-center justify-center mb-8">
                <Text className="text-4xl">🚨</Text>
              </View>

              <Text className="text-2xl font-bold text-brand-black mb-2 text-center">
                Alert Active
              </Text>
              <Text className="text-base text-brand-muted text-center mb-6 px-4">
                Your trusted contacts have been notified. You can cancel during the grace window.
              </Text>

              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  cancelAlert()
                }}
                className="w-full py-5 rounded-xl border-2 border-brand-black bg-brand-white active:opacity-80"
              >
                <Text className="text-center text-brand-black text-xl font-semibold">
                  Cancel Alert
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="w-full items-center">
              <View className="w-24 h-24 rounded-full bg-brand-accent items-center justify-center mb-8">
                <Clock size={48} color="#000000" strokeWidth={2} />
              </View>

              {timeRemaining !== null && timeRemaining > 0 && (
                <View className="mb-6 items-center">
                  <Text className="text-sm text-brand-muted mb-2">Time remaining</Text>
                  <Text className="text-4xl font-bold text-brand-black">
                    {formatTime(timeRemaining)}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleConfirmCheckIn}
                className="w-full py-5 rounded-xl border-2 border-brand-black bg-brand-black active:opacity-80"
              >
                <Text className="text-center text-brand-white text-xl font-semibold">
                  I'm Safe — Confirm Check-In
                </Text>
              </Pressable>

              <Text className="mt-4 text-sm text-brand-muted text-center px-4">
                Confirm before the timer runs out to prevent an alert
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

export default HomeScreen
