import { useAppStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, MapPin, XCircle } from 'lucide-react-native'
import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const AlertDetailScreen = () => {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const events = useAppStore((s) => s.events)
  
  const event = events.find((e) => e.id === id)

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg font-semibold text-brand-muted">
            Event not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 rounded-2xl bg-brand-black"
          >
            <Text className="text-brand-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const getStatusIcon = () => {
    switch (event.status) {
      case 'confirmed':
        return <CheckCircle2 size={32} color="#10B981" />
      case 'cancelled':
        return <XCircle size={32} color="#9CA3AF" />
      case 'triggered':
        return <AlertTriangle size={32} color="#EF4444" />
      default:
        return <Clock size={32} color="#6B7280" />
    }
  }

  const getStatusColor = () => {
    switch (event.status) {
      case 'confirmed':
        return 'text-green-600'
      case 'cancelled':
        return 'text-gray-600'
      case 'triggered':
        return 'text-red-600'
      default:
        return 'text-brand-muted'
    }
  }

  const getTypeLabel = () => {
    switch (event.type) {
      case 'CHECK_IN':
        return 'Check-In'
      case 'ALERT':
        return 'Alert'
      case 'PANIC':
        return 'Panic'
      default:
        return 'Event'
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center px-6 pt-4 pb-8">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 p-2 rounded-xl active:opacity-70"
          >
            <ArrowLeft size={24} color="#000000" />
          </Pressable>
          <Text className="text-2xl font-bold text-brand-black">
            Event Details
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-8">
            <View className="mb-4">{getStatusIcon()}</View>
            <Text className={`text-2xl font-bold mt-2 ${getStatusColor()}`}>
              {getTypeLabel()}
            </Text>
            <Text className="text-sm text-brand-muted mt-2 capitalize">
              {event.status}
            </Text>
          </View>

          <View className="gap-4 mb-6">
            <View className="p-5 rounded-2xl bg-white shadow-sm">
              <View className="flex-row items-center gap-3 mb-4">
                <Clock size={20} color="#6B7280" />
                <Text className="text-sm font-semibold text-brand-muted uppercase tracking-wide">
                  Timestamp
                </Text>
              </View>
              <Text className="text-lg font-semibold text-brand-black mt-1 mb-1">
                {formatDate(event.timestamp)}
              </Text>
              <Text className="text-sm text-brand-muted mt-1">
                {new Date(event.timestamp).toLocaleString()}
              </Text>
            </View>

            {event.checkInTime && (
              <View className="p-5 rounded-2xl bg-white shadow-sm">
                <View className="flex-row items-center gap-3 mb-4">
                  <Clock size={20} color="#6B7280" />
                  <Text className="text-sm font-semibold text-brand-muted uppercase tracking-wide">
                    Check-In Time
                  </Text>
                </View>
                <Text className="text-lg font-semibold text-brand-black mt-1">
                  {formatDate(event.checkInTime)}
                </Text>
              </View>
            )}

            {event.alertTime && (
              <View className="p-5 rounded-2xl bg-white shadow-sm">
                <View className="flex-row items-center gap-3 mb-4">
                  <AlertTriangle size={20} color="#EF4444" />
                  <Text className="text-sm font-semibold text-brand-muted uppercase tracking-wide">
                    Alert Time
                  </Text>
                </View>
                <Text className="text-lg font-semibold text-brand-black mt-1">
                  {formatDate(event.alertTime)}
                </Text>
              </View>
            )}

            <View className="p-5 rounded-2xl bg-white shadow-sm">
              <View className="flex-row items-center gap-3 mb-4">
                <MapPin size={20} color="#6B7280" />
                <Text className="text-sm font-semibold text-brand-muted uppercase tracking-wide">
                  Location
                </Text>
              </View>
              {event.location ? (
                <>
                  <Text className="text-base text-brand-black mt-1 mb-2 font-semibold">
                    {event.location.latitude.toFixed(6)}, {event.location.longitude.toFixed(6)}
                  </Text>
                  {event.location.accuracy && (
                    <Text className="text-sm text-brand-muted mt-1">
                      Accuracy: ±{Math.round(event.location.accuracy)}m
                    </Text>
                  )}
                  <Pressable
                    onPress={async () => {
                      const url = `https://maps.google.com/?q=${event.location!.latitude},${event.location!.longitude}`
                      const canOpen = await Linking.canOpenURL(url)
                      if (canOpen) {
                        await Linking.openURL(url)
                      }
                    }}
                    className="mt-3 py-2.5 px-5 rounded-xl bg-brand-light active:opacity-80 self-start"
                  >
                    <Text className="text-sm font-semibold text-brand-black">
                      Open in Maps
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text className="text-base text-brand-black mt-1 mb-1">
                    Location not available
                  </Text>
                  <Text className="text-sm text-brand-muted mt-1">
                    Location was not captured for this event
                  </Text>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default AlertDetailScreen

