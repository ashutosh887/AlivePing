import { AlertScreen } from '@/components/alert/AlertScreen'
import { useCheckIn } from '@/lib/hooks/useCheckIn'
import { getSession } from '@/lib/solana/program'
import { getWalletPublicKey } from '@/lib/solana/wallet'
import { useAppStore } from '@/lib/store'
import { formatDate, formatTime } from '@/lib/utils'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { AlertTriangle, Clock, Shield, Zap } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [onChainStatus, setOnChainStatus] = useState<string | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)

  useEffect(() => {
    loadWalletInfo()
  }, [])

  useEffect(() => {
    if (checkIn?.isActive) {
      checkOnChainStatus()
    }
  }, [checkIn?.isActive])

  const loadWalletInfo = async () => {
    try {
      const address = await getWalletPublicKey()
      setWalletAddress(address)
    } catch (error) {
      console.error('Load wallet error:', error)
    }
  }

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
      setOnChainStatus('Error')
    } finally {
      setIsLoadingStatus(false)
    }
  }

  if (isAlertActive) {
    return <AlertScreen />
  }

  const handleStartCheckIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    startCheckIn()
  }

  const handleConfirmCheckIn = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    confirmCheckIn()
  }

  const handlePanic = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    const locationService = await import('@/lib/location/locationService')
    const solanaProgram = await import('@/lib/solana/program')
    const location = await locationService.getCurrentLocation()
    triggerPanicStore(location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    } : undefined)
    
    try {
      const locationHash = location ? await locationService.hashLocation(location) : new Array(32).fill(0)
      await solanaProgram.triggerPanic(locationHash)
    } catch (error) {
      console.error('Solana panic error:', error)
    }
  }

  const recentEvents = events.slice(0, 3)
  const activeScheduled = scheduledCheckIns.filter(s => s.isActive)

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-8 pb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-3xl font-bold text-brand-black">
              Safety Hub
            </Text>
            {walletAddress && (
              <Pressable
                onPress={() => router.push('/flows/settings')}
                className="px-3 py-1.5 rounded-full bg-brand-light active:opacity-80"
              >
                <Text className="text-xs font-semibold text-brand-black">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </Text>
              </Pressable>
            )}
          </View>
          <Text className="text-base text-brand-muted mb-6">
            Your personal safety command center
          </Text>

          {!checkIn?.isActive ? (
            <View className="gap-4 mb-6">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleStartCheckIn}
                  disabled={isProcessing}
                  className="flex-1 py-5 rounded-2xl bg-brand-black active:opacity-90 disabled:opacity-50 shadow-lg items-center justify-center"
                >
                  <Clock size={28} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-center text-brand-white text-lg font-semibold mt-2">
                    {isProcessing ? 'Starting...' : 'Start Check-In'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handlePanic}
                  disabled={isProcessing}
                  className="flex-1 py-5 rounded-2xl bg-red-600 active:opacity-90 disabled:opacity-50 shadow-lg items-center justify-center"
                >
                  <AlertTriangle size={28} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-center text-brand-white text-lg font-semibold mt-2">
                    Panic
                  </Text>
                </Pressable>
              </View>

              {activeScheduled.length > 0 && (
                <View className="p-4 rounded-2xl bg-brand-light">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Clock size={16} color="#000000" />
                    <Text className="text-sm font-semibold text-brand-black">
                      Scheduled Check-Ins
                    </Text>
                  </View>
                  <Text className="text-xs text-brand-muted">
                    {activeScheduled.length} active schedule{activeScheduled.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {trustedContacts.length === 0 && (
                <Pressable
                  onPress={() => router.push('/flows/contacts')}
                  className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 active:opacity-80"
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
                </Pressable>
              )}
            </View>
          ) : (
            <View className="mb-6 p-5 rounded-2xl bg-brand-accent">
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

              <Pressable
                onPress={handleConfirmCheckIn}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-brand-black active:opacity-90 disabled:opacity-50 shadow-lg"
              >
                <Text className="text-center text-brand-white text-lg font-semibold">
                  {isProcessing ? 'Confirming...' : "I'm Safe — Confirm"}
                </Text>
              </Pressable>
            </View>
          )}

          {recentEvents.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
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
              <View className="gap-2">
                {recentEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => router.push(`/flows/history/${event.id}`)}
                    className="p-4 rounded-xl bg-white shadow-sm active:opacity-80"
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
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/flows/contacts')}
              className="flex-1 p-4 rounded-2xl bg-white shadow-sm active:opacity-80"
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
            </Pressable>

            <Pressable
              onPress={() => router.push('/flows/history')}
              className="flex-1 p-4 rounded-2xl bg-white shadow-sm active:opacity-80"
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
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default HomeScreen
