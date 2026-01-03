import { AppIcon } from '@/components/AppIcon'
import { SolanaLogo } from '@/components/SolanaLogo'
import configs from '@/config'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import React from 'react'
import { Pressable, ScrollView, Text, View, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const RootScreen = () => {
  const handleGetStarted = () => {
    Alert.alert('Get Started', 'Welcome to AlivePing!')
  }

  const handleAuthorPress = async () => {
    if (configs.appAuthorGitHub) {
      const canOpen = await Linking.canOpenURL(configs.appAuthorGitHub)
      if (canOpen) {
        try {
          await Linking.openURL(configs.appAuthorGitHub)
        } catch (error) {
          Alert.alert('Error', 'Unable to open the link')
        }
      }
    }
  }

  const handleSolanaPress = async () => {
    if (configs.solanaUrl) {
      const canOpen = await Linking.canOpenURL(configs.solanaUrl)
      if (canOpen) {
        try {
          await Linking.openURL(configs.solanaUrl)
        } catch (error) {
          Alert.alert('Error', 'Unable to open the link')
        }
      }
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-white" edges={['top', 'bottom']}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-8">
          <View className="flex-1 items-center justify-center">
            <View className="items-center mb-8">
              <AppIcon size="5xl" />
              
              <Text className="text-brand-black text-5xl font-bold mt-6 mb-2 text-center">
                {configs.appName}
              </Text>
              
              <Text className="text-brand-muted text-base text-center font-medium mb-8">
                {configs.appTagline}
              </Text>
            </View>

            <Text className="text-brand-dark text-xl text-center mb-10 leading-8 px-2 max-w-md">
              {configs.appDescription}
            </Text>

            <Pressable
              className="w-full max-w-[340px] bg-brand-black py-5 rounded-2xl items-center justify-center flex-row gap-3 mb-6"
              onPress={handleGetStarted}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
              <Text className="text-brand-white text-xl font-bold">
                Get Started
              </Text>
            </Pressable>
          </View>

          <View className="items-center gap-3 pb-6 pt-4 border-t border-brand-light">
            <View className="flex-row items-center gap-2">
              <Text className="text-brand-muted text-xs">Powered by</Text>
              <Pressable onPress={handleSolanaPress} className="flex-row items-center">
                <SolanaLogo size={20} />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Text className="text-brand-muted text-xs">Made by</Text>
              <Pressable onPress={handleAuthorPress}>
                <Text className="text-brand-dark text-xs font-semibold">
                  {configs.appTeam}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default RootScreen
