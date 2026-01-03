import { History } from 'lucide-react-native'
import React from 'react'
import { Text, View } from 'react-native'

export const EmptyHistoryState = () => {
  return (
    <View className="items-center justify-center py-16">
      <View className="w-20 h-20 rounded-full bg-brand-light items-center justify-center mb-6">
        <History size={40} color="#9CA3AF" strokeWidth={1.5} />
      </View>
      <Text className="mt-2 text-lg font-semibold text-brand-muted">
        No history yet
      </Text>
      <Text className="mt-3 text-sm text-brand-muted text-center px-8 leading-5">
        Your check-ins and alerts will appear here
      </Text>
    </View>
  )
}

