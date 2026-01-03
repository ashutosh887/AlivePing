import React from 'react'
import { Text, View } from 'react-native'

type SettingsSectionProps = {
  title: string
  children: React.ReactNode
}

export const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  return (
    <View className="mb-6">
      <Text className="text-sm font-semibold text-brand-muted uppercase mb-3 px-1">
        {title}
      </Text>
      {children}
    </View>
  )
}

