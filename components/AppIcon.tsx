import React from 'react'
import { Image, View } from 'react-native'

type AppIconProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
}

const sizeMap = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 160,
  '2xl': 200,
  '3xl': 240,
  '4xl': 280,
  '5xl': 320,
}

export const AppIcon = ({ size = 'lg' }: AppIconProps) => {
  const iconSize = sizeMap[size]

  return (
    <View className="items-center justify-center">
      <Image
        source={require('../assets/images/icon.png')}
        style={{ 
          width: iconSize, 
          height: iconSize,
          borderRadius: iconSize / 2,
        }}
        resizeMode="contain"
      />
    </View>
  )
}

