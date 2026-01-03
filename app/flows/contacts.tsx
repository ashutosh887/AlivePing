import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const ContactsScreen = () => {
  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Contacts Screen</Text>
      </View>
    </SafeAreaView>
  )
}

export default ContactsScreen

