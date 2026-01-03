import { LucideIcon } from 'lucide-react-native'
import React from 'react'
import { Pressable, Switch, Text, View } from 'react-native'

type SettingsItemProps = {
  icon?: LucideIcon
  title: string
  subtitle?: string
  value?: boolean
  onToggle?: (value: boolean) => void
  onPress?: () => void
  rightElement?: React.ReactNode
  showArrow?: boolean
}

export const SettingsItem = ({
  icon: Icon,
  title,
  subtitle,
  value,
  onToggle,
  onPress,
  rightElement,
  showArrow = false,
}: SettingsItemProps) => {
  const content = (
    <View className="flex-row items-center justify-between py-4 px-5">
      <View className="flex-row items-center gap-3 flex-1">
        {Icon && (
          <View className="w-10 h-10 rounded-xl bg-brand-accent items-center justify-center">
            <Icon size={18} color="#000000" />
          </View>
        )}
        
        <View className="flex-1">
          <Text className="text-base font-semibold text-brand-black">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-brand-muted mt-0.5 leading-5">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      <View className="flex-row items-center gap-3">
        {rightElement}
        {onToggle !== undefined && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#E5E7EB', true: '#000000' }}
            thumbColor="#FFFFFF"
          />
        )}
        {showArrow && !onToggle && (
          <Text className="text-brand-muted text-xl">›</Text>
        )}
      </View>
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    )
  }

  return <View>{content}</View>
}

