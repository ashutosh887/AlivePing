import { AlertDetailCard } from '@/components/history/AlertDetailCard'
import { EmptyHistoryState } from '@/components/history/EmptyHistoryState'
import { useAppStore } from '@/lib/store'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const HistoryScreen = () => {
  const events = useAppStore((s) => s.events)

  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="pt-8 pb-8 px-6">
          <Text className="text-3xl font-bold text-brand-black mb-2">
            History
          </Text>
          <Text className="text-base text-brand-muted">
            View your check-ins and alerts
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {sortedEvents.length === 0 ? (
            <EmptyHistoryState />
          ) : (
            <View className="gap-4 pb-10">
              {sortedEvents.map((event) => (
                <AlertDetailCard key={event.id} event={event} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default HistoryScreen
