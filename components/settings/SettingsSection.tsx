import React from 'react'
import { Text, View } from 'react-native'

type SettingsSectionProps = {
  title: string
  children: React.ReactNode
}

export const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  return (
    <View className="mb-5">
      <Text className="text-xs font-semibold text-brand-muted uppercase mb-3 px-1 tracking-wide">
        {title}
      </Text>
      {children}
    </View>
  )
}

