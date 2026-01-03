import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
          <Button
            onPress={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
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
        <View className="flex-row items-center px-6 pt-8 pb-6">
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
            <Card>
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
            </Card>

            {event.checkInTime && (
              <Card>
                <View className="flex-row items-center gap-3 mb-4">
                  <Clock size={20} color="#6B7280" />
                  <Text className="text-sm font-semibold text-brand-muted uppercase tracking-wide">
                    Check-In Time
                  </Text>
                </View>
                <Text className="text-lg font-semibold text-brand-black mt-1">
                  {formatDate(event.checkInTime)}
                </Text>
              </Card>
            )}

            {event.alertTime && (
              <Card>
                <View className="flex-row items-center gap-3 mb-4">
                  <AlertTriangle size={20} color="#EF4444" />
                  <Text className="text-sm font-semibold text-brand-muted uppercase tracking-wide">
                    Alert Time
                  </Text>
                </View>
                <Text className="text-lg font-semibold text-brand-black mt-1">
                  {formatDate(event.alertTime)}
                </Text>
              </Card>
            )}

            <Card>
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
                  <Button
                    onPress={async () => {
                      const url = `https://maps.google.com/?q=${event.location!.latitude},${event.location!.longitude}`
                      const canOpen = await Linking.canOpenURL(url)
                      if (canOpen) {
                        await Linking.openURL(url)
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="mt-3 self-start"
                  >
                    Open in Maps
                  </Button>
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
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default AlertDetailScreen

