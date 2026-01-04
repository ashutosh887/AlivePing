import { AlertScreen } from '@/components/alert/AlertScreen'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { useCheckIn } from '@/lib/hooks/useCheckIn'
import { BatteryInfo, getBatteryInfo, subscribeToBatteryUpdates } from '@/lib/services/battery'
import { getNextScheduledTime } from '@/lib/services/scheduledCheckIns'
import { getSession } from '@/lib/solana/program'
import { useAppStore } from '@/lib/store'
import { formatDate, formatTime } from '@/lib/utils'
import { hapticImpact, hapticNotification, Haptics } from '@/lib/utils/haptics'
import { useRouter } from 'expo-router'
import { AlertTriangle, Battery, Clock, Shield, Zap } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const IST_TIMEZONE = 'Asia/Kolkata'

const HomeScreen = () => {
  const router = useRouter()
  const {
    checkIn,
    timeRemaining,
    isAlertActive,
    isProcessing,
    startCheckIn,
    confirmCheckIn,
  } = useCheckIn()
  
  const events = useAppStore((s) => s.events)
  const trustedContacts = useAppStore((s) => s.trustedContacts)
  const scheduledCheckIns = useAppStore((s) => s.scheduledCheckIns)
  const triggerPanicStore = useAppStore((s) => s.triggerPanic)
  const [onChainStatus, setOnChainStatus] = useState<string | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null)

  useEffect(() => {
    if (checkIn?.isActive) {
      checkOnChainStatus()
    }
  }, [checkIn?.isActive])

  useEffect(() => {
    const loadBatteryInfo = async () => {
      const info = await getBatteryInfo()
      setBatteryInfo(info)
    }
    
    loadBatteryInfo()
    
    const unsubscribe = subscribeToBatteryUpdates((info) => {
      setBatteryInfo(info)
    })
    
    return unsubscribe
  }, [])

  useEffect(() => {
    if (checkIn?.isActive || isProcessing) {
      return
    }

    let lastTriggeredMinute = -1

    const checkScheduledCheckIns = () => {
      const now = new Date()
      const nowIST = new Date(now.toLocaleString('en-US', { timeZone: IST_TIMEZONE }))
      const currentDay = nowIST.getDay()
      const currentHour = nowIST.getHours()
      const currentMinute = nowIST.getMinutes()
      const currentSecond = nowIST.getSeconds()

      if (currentSecond > 5) {
        return
      }

      const activeScheduled = scheduledCheckIns.filter(s => s.isActive)
      
      for (const scheduled of activeScheduled) {
        if (!scheduled.days.includes(currentDay)) {
          continue
        }

        const [scheduledHour, scheduledMinute] = scheduled.time.split(':').map(Number)
        
        if (scheduledHour === currentHour && scheduledMinute === currentMinute) {
          const minuteKey = `${scheduled.id}-${currentHour}-${currentMinute}`
          
          if (lastTriggeredMinute !== scheduledMinute) {
            hapticNotification(Haptics.NotificationFeedbackType.Success)
            startCheckIn()
            lastTriggeredMinute = currentMinute
            break
          }
        }
      }
    }

    const interval = setInterval(checkScheduledCheckIns, 1000)
    checkScheduledCheckIns()

    return () => clearInterval(interval)
  }, [scheduledCheckIns, checkIn?.isActive, isProcessing, startCheckIn])

  const checkOnChainStatus = async () => {
    setIsLoadingStatus(true)
    try {
      const session = await getSession()
      if (session) {
        const statuses = ['Active', 'Confirmed', 'Expired', 'Panic', 'Closed']
        setOnChainStatus(statuses[session.status] || 'Unknown')
      } else {
        setOnChainStatus('Not on-chain')
      }
    } catch (error) {
      setOnChainStatus(null)
    } finally {
      setIsLoadingStatus(false)
    }
  }

  if (isAlertActive) {
    return <AlertScreen />
  }

  const handleStartCheckIn = async () => {
    await hapticImpact()
    startCheckIn()
  }

  const handleConfirmCheckIn = async () => {
    await hapticNotification()
    confirmCheckIn()
  }

  const handlePanic = async () => {
    await hapticNotification(Haptics.NotificationFeedbackType.Error)
    const locationService = await import('@/lib/location/locationService')
    const solanaProgram = await import('@/lib/solana/program')
    const phoneOffFallback = await import('@/lib/services/phoneOffFallback')
    const whatsappService = await import('@/lib/services/whatsapp')
    const location = await locationService.getCurrentLocation()
    const locationData = location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    } : undefined
    
    const panicEvent = triggerPanicStore(locationData)
    
    phoneOffFallback.updateLastKnownState({
      timestamp: Date.now(),
      location: locationData,
      checkInStatus: 'active',
      eventType: 'panic',
    })
    
    const notificationPreferences = useAppStore.getState().notificationPreferences
    const updateEventWhatsAppStatus = useAppStore.getState().updateEventWhatsAppStatus
    
    const whatsappEnabled = notificationPreferences?.whatsappEnabled ?? true
    
    if (whatsappEnabled && panicEvent) {
      const batteryService = await import('@/lib/services/battery')
      const currentBattery = await batteryService.getBatteryInfo()
      
      const alertMessage = whatsappService.generateAlertMessage(
        'panic', 
        locationData,
        undefined,
        currentBattery ? {
          batteryLevel: currentBattery.batteryLevel,
          isCharging: currentBattery.isCharging,
          deviceModel: currentBattery.deviceModel,
          manufacturer: currentBattery.manufacturer,
        } : null
      )
      const alertPhone = whatsappService.getAlertPhoneNumber()
      
      const sent = await whatsappService.sendWhatsApp({
        to: alertPhone,
        message: alertMessage,
      }).catch(() => false)
      
      updateEventWhatsAppStatus(panicEvent.id, sent)
    }
    
    try {
      const locationHash = location ? await locationService.hashLocation(location) : new Array(32).fill(0)
      await solanaProgram.triggerPanic(locationHash)
    } catch (error) {
    }
  }

  const recentEvents = events.slice(0, 3)
  const activeScheduled = scheduledCheckIns.filter(s => s.isActive)

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <ScreenHeader
          title="Safety Hub"
          subtitle="Your personal safety command center"
        />
        
        <View className="px-6 pb-6">

          {!checkIn?.isActive ? (
            <View className="gap-4 mb-6">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleStartCheckIn}
                  disabled={isProcessing}
                  className="flex-1 py-4 rounded-2xl bg-brand-dark active:opacity-90 disabled:opacity-50 items-center justify-center"
                >
                  <Clock size={22} color="#FFFFFF" strokeWidth={2} />
                  <Text className="text-center text-brand-white text-base font-semibold mt-1.5">
                    {isProcessing ? 'Starting...' : 'Start Check-In'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handlePanic}
                  disabled={isProcessing}
                  className="flex-1 py-4 rounded-2xl bg-red-500 active:opacity-90 disabled:opacity-50 items-center justify-center"
                >
                  <AlertTriangle size={22} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
                  <Text className="text-center text-brand-white text-base font-semibold mt-1.5">
                    Panic
                  </Text>
                </Pressable>
              </View>

              {activeScheduled.length > 0 && (
                <Card
                  variant="light"
                  onPress={() => router.push('/flows/scheduled')}
                >
                  <View className="flex-row items-center gap-3 mb-2">
                    <Clock size={18} color="#000000" />
                    <Text className="text-sm font-semibold text-brand-black">
                      Scheduled Check-Ins
                    </Text>
                  </View>
                  <Text className="text-xs text-brand-muted">
                    {activeScheduled.length} active schedule{activeScheduled.length !== 1 ? 's' : ''}
                  </Text>
                </Card>
              )}

              {trustedContacts.length === 0 && (
                <Card
                  onPress={() => router.push('/flows/contacts')}
                  className="bg-yellow-50 border border-yellow-200"
                >
                  <View className="flex-row items-center gap-3">
                    <Shield size={20} color="#F59E0B" />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-brand-black">
                        Add Trusted Contacts
                      </Text>
                      <Text className="text-xs text-brand-muted mt-0.5">
                        No emergency contacts configured
                      </Text>
                    </View>
                  </View>
                </Card>
              )}
            </View>
          ) : (
            <Card variant="accent" className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <Clock size={24} color="#000000" strokeWidth={2.5} />
                  <Text className="text-lg font-semibold text-brand-black">
                    Active Check-In
                  </Text>
                </View>
                {isLoadingStatus ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : onChainStatus && (
                  <View className="px-2.5 py-1 rounded-full bg-brand-black">
                    <Text className="text-xs font-semibold text-brand-white">
                      {onChainStatus}
                    </Text>
                  </View>
                )}
              </View>

              {timeRemaining !== null && timeRemaining > 0 && (
                <View className="mb-4">
                  <Text className="text-sm text-brand-muted mb-2 font-medium">Time remaining</Text>
                  <Text className="text-4xl font-bold text-brand-black tracking-tight">
                    {formatTime(timeRemaining)}
                  </Text>
                </View>
              )}

              <Button
                onPress={handleConfirmCheckIn}
                disabled={isProcessing}
                loading={isProcessing}
                fullWidth
                size="lg"
              >
                {isProcessing ? 'Confirming...' : "I'm Safe — Confirm"}
              </Button>
            </Card>
          )}

          {recentEvents.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-brand-black">
                  Recent Activity
                </Text>
                <Pressable
                  onPress={() => router.push('/flows/history')}
                  className="active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-brand-muted">
                    View All
                  </Text>
                </Pressable>
              </View>
              <View className="gap-3">
                {recentEvents.map((event) => (
                  <Card
                    key={event.id}
                    onPress={() => router.push(`/flows/history/${event.id}`)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        {event.type === 'PANIC' ? (
                          <AlertTriangle size={20} color="#EF4444" />
                        ) : event.type === 'ALERT' ? (
                          <AlertTriangle size={20} color="#F59E0B" />
                        ) : (
                          <Clock size={20} color="#6B7280" />
                        )}
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-brand-black">
                            {event.type === 'PANIC' ? 'Panic Alert' : event.type === 'ALERT' ? 'Alert' : 'Check-In'}
                          </Text>
                          <Text className="text-xs text-brand-muted mt-0.5">
                            {formatDate(event.timestamp)}
                          </Text>
                        </View>
                      </View>
                      <View className={`px-2.5 py-1 rounded-full ${
                        event.status === 'confirmed' ? 'bg-green-100' :
                        event.status === 'triggered' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          event.status === 'confirmed' ? 'text-green-700' :
                          event.status === 'triggered' ? 'text-red-700' :
                          'text-gray-700'
                        }`}>
                          {event.status}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}

          <View className="flex-row gap-3">
            <Card
              onPress={() => router.push('/flows/contacts')}
              className="flex-1"
            >
              <View className="items-center">
                <View className="w-12 h-12 rounded-full bg-brand-accent items-center justify-center mb-2">
                  <Shield size={24} color="#000000" />
                </View>
                <Text className="text-sm font-semibold text-brand-black">
                  Contacts
                </Text>
                <Text className="text-xs text-brand-muted mt-0.5">
                  {trustedContacts.length} contact{trustedContacts.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </Card>

            <Card
              onPress={() => router.push('/flows/history')}
              className="flex-1"
            >
              <View className="items-center">
                <View className="w-12 h-12 rounded-full bg-brand-accent items-center justify-center mb-2">
                  <Zap size={24} color="#000000" />
                </View>
                <Text className="text-sm font-semibold text-brand-black">
                  History
                </Text>
                <Text className="text-xs text-brand-muted mt-0.5">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </Card>

            <Card className="flex-1">
              <View className="items-center">
                {batteryInfo ? (
                  <>
                    <View className="w-12 h-12 rounded-full bg-brand-accent items-center justify-center mb-2">
                      <Battery 
                        size={20} 
                        strokeWidth={2.5}
                        color={batteryInfo.batteryLevel > 50 ? "#10B981" : batteryInfo.batteryLevel > 20 ? "#F59E0B" : "#EF4444"} 
                        fill={batteryInfo.isCharging ? (batteryInfo.batteryLevel > 50 ? "#10B981" : batteryInfo.batteryLevel > 20 ? "#F59E0B" : "#EF4444") : "none"}
                      />
                    </View>
                    <Text className="text-sm font-semibold text-brand-black" numberOfLines={1}>
                      Battery
                    </Text>
                    <Text className="text-xs text-brand-muted mt-0.5" numberOfLines={1}>
                      {batteryInfo.isCharging ? 'Charging' : `${batteryInfo.batteryLevel}%`}
                    </Text>
                  </>
                ) : (
                  <>
                    <View className="w-12 h-12 rounded-full bg-brand-accent items-center justify-center mb-2">
                      <Battery size={20} color="#9CA3AF" strokeWidth={2.5} />
                    </View>
                    <Text className="text-sm font-semibold text-brand-black" numberOfLines={1}>
                      Battery
                    </Text>
                    <Text className="text-xs text-brand-muted mt-0.5" numberOfLines={1}>
                      N/A
                    </Text>
                  </>
                )}
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default HomeScreen
