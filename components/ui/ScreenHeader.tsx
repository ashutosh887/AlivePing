import React from 'react'
import { Text, View } from 'react-native'

type ScreenHeaderProps = {
  title: string
  subtitle?: string
  rightElement?: React.ReactNode
}

export const ScreenHeader = ({ title, subtitle, rightElement }: ScreenHeaderProps) => {
  return (
    <View className="pt-8 pb-6 px-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-3xl font-bold text-brand-black">
          {title}
        </Text>
        {rightElement}
      </View>
      {subtitle && (
        <Text className="text-base text-brand-muted">
          {subtitle}
        </Text>
      )}
    </View>
  )
}

