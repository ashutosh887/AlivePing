import React from 'react'
import { Pressable, View, ViewProps } from 'react-native'

type CardProps = {
  children: React.ReactNode
  onPress?: () => void
  className?: string
  variant?: 'default' | 'light' | 'accent'
}

export const Card = ({ children, onPress, className = '', variant = 'default' }: CardProps) => {
  const baseClasses = 'p-5 rounded-2xl'
  
  const variantClasses = {
    default: 'bg-white',
    light: 'bg-brand-light',
    accent: 'bg-brand-accent',
  }

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${combinedClasses} active:opacity-80`}>
        {children}
      </Pressable>
    )
  }

  return <View className={combinedClasses}>{children}</View>
}

