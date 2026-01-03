import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const HomeScreen = () => {
  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Home Screen</Text>
      </View>
    </SafeAreaView>
  )
}

export default HomeScreen