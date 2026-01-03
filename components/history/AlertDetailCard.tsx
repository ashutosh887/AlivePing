import { Event } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'expo-router'
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react-native'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

type AlertDetailCardProps = {
  event: Event
}

export const AlertDetailCard = ({ event }: AlertDetailCardProps) => {
  const router = useRouter()

  const getStatusIcon = () => {
    switch (event.status) {
      case 'confirmed':
        return <CheckCircle2 size={20} color="#10B981" />
      case 'cancelled':
        return <XCircle size={20} color="#9CA3AF" />
      case 'triggered':
        return <AlertTriangle size={20} color="#EF4444" />
      default:
        return <Clock size={20} color="#6B7280" />
    }
  }

  const getStatusColor = () => {
    switch (event.status) {
      case 'confirmed':
        return 'bg-green-50 border-green-200'
      case 'cancelled':
        return 'bg-gray-50 border-gray-200'
      case 'triggered':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-white border-brand-light'
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
        <Pressable
          onPress={() => router.push(`/flows/history/${event.id}`)}
          className={`p-5 rounded-2xl ${getStatusColor()} active:opacity-80 shadow-sm`}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row items-start gap-4">
              <View className="mt-0.5">{getStatusIcon()}</View>
              
              <View className="flex-1">
                <View className="flex-row items-center gap-2.5 mb-2.5">
                  <Text className="text-lg font-semibold text-brand-black">
                    {getTypeLabel()}
                  </Text>
                  <View className="px-3 py-1.5 rounded-full bg-brand-light">
                    <Text className="text-xs font-medium text-brand-muted capitalize">
                      {event.status}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-sm text-brand-muted mb-2.5">
                  {formatDate(event.timestamp)}
                </Text>
                
                {event.checkInTime && (
                  <Text className="text-xs text-brand-muted">
                    Check-in time: {formatDate(event.checkInTime)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      )
}

