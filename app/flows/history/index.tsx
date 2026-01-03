import { AlertDetailCard } from '@/components/history/AlertDetailCard'
import { EmptyHistoryState } from '@/components/history/EmptyHistoryState'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { useAppStore } from '@/lib/store'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const HistoryScreen = () => {
  const events = useAppStore((s) => s.events)

  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top']}>
      <View className="flex-1">
        <ScreenHeader
          title="History"
          subtitle="View your check-ins and alerts"
        />

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {sortedEvents.length === 0 ? (
            <EmptyHistoryState />
          ) : (
            <View className="gap-4">
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
